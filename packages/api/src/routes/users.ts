import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const OnboardingSchema = z.object({
  clerkId: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  currentWeight: z.number().positive(),
  goalWeight: z.number().positive(),
  height: z.number().int().positive(),
  age: z.number().int().positive(),
  targetPace: z.enum(['SLOW', 'STEADY', 'ACTIVE']).optional(),
  weightUnit: z.enum(['LBS', 'KG']).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  dislikedFoods: z.string().optional(),
  cookTimePreference: z.enum(['QUICK', 'MODERATE', 'FULL']).optional(),
  mealPlanPreferences: z.record(z.unknown()).optional(),
});

// POST /api/users/onboard — create user after onboarding
router.post('/onboard', async (req: Request, res: Response) => {
  const parsed = OnboardingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.user.findUnique({ where: { clerkId: parsed.data.clerkId } });
  if (existing) return res.json(existing);

  const user = await prisma.user.create({
    data: {
      clerkId: parsed.data.clerkId,
      email: parsed.data.email,
      name: parsed.data.name,
      currentWeight: parsed.data.currentWeight,
      goalWeight: parsed.data.goalWeight,
      height: parsed.data.height,
      age: parsed.data.age,
      targetPace: parsed.data.targetPace ?? 'STEADY',
      weightUnit: parsed.data.weightUnit ?? 'LBS',
      dietaryRestrictions: parsed.data.dietaryRestrictions ?? [],
      dislikedFoods: parsed.data.dislikedFoods,
      cookTimePreference: parsed.data.cookTimePreference ?? 'MODERATE',
      mealPlanPreferences: parsed.data.mealPlanPreferences ?? {},
    },
  });

  return res.status(201).json(user);
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  currentWeight: z.number().positive().optional(),
  goalWeight: z.number().positive().optional(),
  height: z.number().int().positive().optional(),
  age: z.number().int().positive().optional(),
  targetPace: z.enum(['SLOW', 'STEADY', 'ACTIVE']).optional(),
  weightUnit: z.enum(['LBS', 'KG']).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  dislikedFoods: z.string().optional(),
  cookTimePreference: z.enum(['QUICK', 'MODERATE', 'FULL']).optional(),
  mealPlanPreferences: z.record(z.unknown()).optional(),
});

// GET /api/users/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: { favoriteMeals: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

// PATCH /api/users/me
router.patch('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = UpdateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: parsed.data,
  });
  return res.json(updated);
});

export default router;
