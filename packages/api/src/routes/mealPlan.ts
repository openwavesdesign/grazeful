import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateMealPlan, regenerateMeal } from '../services/ai';

const router = Router();

// Rate limit: max 3 AI regenerations per user per day (in-memory, simple)
const regen_counts: Record<string, { count: number; date: string }> = {};

function checkRegenLimit(userId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const record = regen_counts[userId];
  if (!record || record.date !== today) {
    regen_counts[userId] = { count: 1, date: today };
    return true;
  }
  if (record.count >= 3) return false;
  record.count++;
  return true;
}

// POST /api/meal-plan/generate
router.post('/generate', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: { favoriteMeals: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const prefs = (user.mealPlanPreferences as Record<string, unknown>) || {};

  let planData;
  try {
    planData = await generateMealPlan({
      dietaryRestrictions: user.dietaryRestrictions,
      dislikedFoods: user.dislikedFoods,
      cookTimePreference: user.cookTimePreference,
      breakfastPreferences: (prefs.breakfastPreferences as string[]) || [],
      lunchPreferences: (prefs.lunchPreferences as string[]) || [],
      daysToGenerate: 7,
      favoriteMeals: user.favoriteMeals.map((m) => m.name),
    });
  } catch (err) {
    return res.status(502).json({ error: 'AI generation failed', detail: String(err) });
  }

  // Deactivate existing active plans
  await prisma.mealPlan.updateMany({
    where: { userId: req.userId!, isActive: true },
    data: { isActive: false },
  });

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday

  const plan = await prisma.mealPlan.create({
    data: {
      userId: req.userId!,
      weekStartDate: weekStart,
      planData: planData as object,
      groceryList: planData.groceryList as object,
      prepInstructions: planData.prepInstructions as object,
      isActive: true,
    },
  });

  return res.status(201).json(plan);
});

// GET /api/meal-plan/current
router.get('/current', requireAuth, async (req: AuthRequest, res) => {
  const plan = await prisma.mealPlan.findFirst({
    where: { userId: req.userId!, isActive: true },
    orderBy: { generatedAt: 'desc' },
  });

  if (!plan) return res.status(404).json({ error: 'No active meal plan' });
  return res.json(plan);
});

// PATCH /api/meal-plan/:mealId/regenerate
router.patch('/:mealId/regenerate', requireAuth, async (req: AuthRequest, res) => {
  if (!checkRegenLimit(req.userId!)) {
    return res.status(429).json({ error: 'Max 3 regenerations per day reached' });
  }

  const { mealType } = z
    .object({ mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER']) })
    .parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const plan = await prisma.mealPlan.findFirst({
    where: { userId: req.userId!, isActive: true },
  });
  if (!plan) return res.status(404).json({ error: 'No active meal plan' });

  let newMeal;
  try {
    newMeal = await regenerateMeal(mealType, {
      dietaryRestrictions: user.dietaryRestrictions,
      dislikedFoods: user.dislikedFoods,
      cookTimePreference: user.cookTimePreference,
    });
  } catch (err) {
    return res.status(502).json({ error: 'AI generation failed', detail: String(err) });
  }

  // Patch the specific day/meal in planData
  const planData = plan.planData as { days: Array<Record<string, unknown>> };
  const dayIndex = Number(req.params.mealId);
  if (planData.days[dayIndex]) {
    planData.days[dayIndex][mealType.toLowerCase()] = newMeal;
  }

  const updated = await prisma.mealPlan.update({
    where: { id: plan.id },
    data: { planData: planData as object },
  });

  return res.json({ meal: newMeal, plan: updated });
});

// POST /api/meal-plan/:mealId/favorite
router.post('/:mealId/favorite', requireAuth, async (req: AuthRequest, res) => {
  const meal = await prisma.meal.findUnique({ where: { id: req.params.mealId } });
  if (!meal) return res.status(404).json({ error: 'Meal not found' });

  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: { favoriteMeals: { where: { id: req.params.mealId } } },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const isFavorited = user.favoriteMeals.length > 0;

  if (isFavorited) {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { favoriteMeals: { disconnect: { id: req.params.mealId } } },
    });
    return res.json({ favorited: false });
  } else {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { favoriteMeals: { connect: { id: req.params.mealId } } },
    });
    return res.json({ favorited: true });
  }
});

export default router;
