import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const MealLogSchema = z.object({
  mealId: z.string().uuid().optional(),
  customMealName: z.string().optional(),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  healthScore: z.number().int().min(1).max(5),
  feelingScore: z.enum(['ENERGIZED', 'NORMAL', 'SLUGGISH', 'HUNGRY']).optional(),
  wasPlanned: z.boolean().optional(),
  skipped: z.boolean().optional(),
  loggedAt: z.string().datetime().optional(),
});

// POST /api/meal-log
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parsed = MealLogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const log = await prisma.mealLog.create({
    data: {
      userId: req.userId!,
      mealId: parsed.data.mealId,
      customMealName: parsed.data.customMealName,
      mealType: parsed.data.mealType,
      healthScore: parsed.data.healthScore,
      feelingScore: parsed.data.feelingScore,
      wasPlanned: parsed.data.wasPlanned ?? false,
      skipped: parsed.data.skipped ?? false,
      loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : undefined,
    },
    include: { meal: true },
  });

  return res.status(201).json(log);
});

// GET /api/meal-log
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const [logs, total] = await Promise.all([
    prisma.mealLog.findMany({
      where: { userId: req.userId! },
      include: { meal: true },
      orderBy: { loggedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.mealLog.count({ where: { userId: req.userId! } }),
  ]);

  return res.json({ logs, total, page, limit });
});

// GET /api/meal-log/today
router.get('/today', requireAuth, async (req: AuthRequest, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const logs = await prisma.mealLog.findMany({
    where: {
      userId: req.userId!,
      loggedAt: { gte: startOfDay, lte: endOfDay },
    },
    include: { meal: true },
    orderBy: { loggedAt: 'asc' },
  });

  return res.json(logs);
});

export default router;
