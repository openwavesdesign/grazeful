import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const LogWeightSchema = z.object({
  weight: z.number().positive(),
  loggedAt: z.string().datetime().optional(),
  note: z.string().optional(),
});

// POST /api/weight
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parsed = LogWeightSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const entry = await prisma.weightEntry.create({
    data: {
      userId: req.userId!,
      weight: parsed.data.weight,
      loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : undefined,
      note: parsed.data.note,
    },
  });

  // Update user's currentWeight
  await prisma.user.update({
    where: { id: req.userId! },
    data: { currentWeight: parsed.data.weight },
  });

  return res.status(201).json(entry);
});

// GET /api/weight
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const { from, to } = req.query as { from?: string; to?: string };

  const entries = await prisma.weightEntry.findMany({
    where: {
      userId: req.userId!,
      loggedAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      },
    },
    orderBy: { loggedAt: 'asc' },
  });

  return res.json(entries);
});

// PATCH /api/weight/:id
router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  const parsed = LogWeightSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const entry = await prisma.weightEntry.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  const updated = await prisma.weightEntry.update({
    where: { id: req.params.id },
    data: {
      ...(parsed.data.weight !== undefined ? { weight: parsed.data.weight } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
    },
  });

  return res.json(updated);
});

// DELETE /api/weight/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const entry = await prisma.weightEntry.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  await prisma.weightEntry.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

export default router;
