import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateWeeklyInsight } from '../services/ai';

const router = Router();

// GET /api/summary/weekly
router.get('/weekly', requireAuth, async (req: AuthRequest, res) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [logs, weightEntries] = await Promise.all([
    prisma.mealLog.findMany({
      where: { userId: req.userId!, loggedAt: { gte: weekAgo }, skipped: false },
    }),
    prisma.weightEntry.findMany({
      where: { userId: req.userId!, loggedAt: { gte: weekAgo } },
      orderBy: { loggedAt: 'asc' },
    }),
  ]);

  const totalCheckIns = logs.length;
  const avgHealthScore =
    totalCheckIns > 0
      ? logs.reduce((sum, l) => sum + l.healthScore, 0) / totalCheckIns
      : 0;

  const weightChange =
    weightEntries.length >= 2
      ? weightEntries[weightEntries.length - 1].weight - weightEntries[0].weight
      : 0;

  // Calculate streak (consecutive days with at least one check-in)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStart = new Date(day.setHours(0, 0, 0, 0));
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const dayLogs = await prisma.mealLog.findFirst({
      where: { userId: req.userId!, loggedAt: { gte: dayStart, lte: dayEnd }, skipped: false },
    });
    if (dayLogs) streak++;
    else break;
  }

  // Find best day (highest avg health score)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayScores: Record<number, number[]> = {};
  for (const log of logs) {
    const d = new Date(log.loggedAt).getDay();
    if (!dayScores[d]) dayScores[d] = [];
    dayScores[d].push(log.healthScore);
  }
  let bestDay = 'N/A';
  let bestScore = 0;
  for (const [day, scores] of Object.entries(dayScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg > bestScore) {
      bestScore = avg;
      bestDay = dayNames[Number(day)];
    }
  }

  const missedMeals = 7 * 3 - totalCheckIns; // 3 meals/day * 7 days

  return res.json({
    weeklyAvgHealthScore: Math.round(avgHealthScore * 10) / 10,
    weightChangeLbs: Math.round(weightChange * 10) / 10,
    checkInStreak: streak,
    totalCheckIns,
    bestDay,
    missedMeals: Math.max(0, missedMeals),
  });
});

// GET /api/summary/insights
router.get('/insights', requireAuth, async (req: AuthRequest, res) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [logs, weightEntries] = await Promise.all([
    prisma.mealLog.findMany({
      where: { userId: req.userId!, loggedAt: { gte: weekAgo }, skipped: false },
    }),
    prisma.weightEntry.findMany({
      where: { userId: req.userId!, loggedAt: { gte: weekAgo } },
      orderBy: { loggedAt: 'asc' },
    }),
  ]);

  const totalCheckIns = logs.length;
  const avgHealthScore =
    totalCheckIns > 0
      ? logs.reduce((sum, l) => sum + l.healthScore, 0) / totalCheckIns
      : 0;

  const weightChange =
    weightEntries.length >= 2
      ? weightEntries[weightEntries.length - 1].weight - weightEntries[0].weight
      : 0;

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStart = new Date(day.setHours(0, 0, 0, 0));
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const dayLogs = await prisma.mealLog.findFirst({
      where: { userId: req.userId!, loggedAt: { gte: dayStart, lte: dayEnd }, skipped: false },
    });
    if (dayLogs) streak++;
    else break;
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayScores: Record<number, number[]> = {};
  for (const log of logs) {
    const d = new Date(log.loggedAt).getDay();
    if (!dayScores[d]) dayScores[d] = [];
    dayScores[d].push(log.healthScore);
  }
  let bestDay = 'N/A';
  let bestScore = 0;
  for (const [day, scores] of Object.entries(dayScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg > bestScore) {
      bestScore = avg;
      bestDay = dayNames[Number(day)];
    }
  }

  const missedMeals = Math.max(0, 7 * 3 - totalCheckIns);

  let insight;
  try {
    insight = await generateWeeklyInsight({
      weeklyAvgHealthScore: Math.round(avgHealthScore * 10) / 10,
      weightChangeLbs: Math.round(weightChange * 10) / 10,
      checkInStreak: streak,
      totalCheckIns,
      bestDay,
      missedMeals,
    });
  } catch (err) {
    return res.status(502).json({ error: 'AI insight generation failed', detail: String(err) });
  }

  return res.json(insight);
});

export default router;
