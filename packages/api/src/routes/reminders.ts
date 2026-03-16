import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const ReminderSchema = z.object({
  label: z.string().min(1),
  isMealReminder: z.boolean().optional(),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).optional(),
  inputType: z.enum(['YES_NO', 'COUNT', 'RATING']).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  daysOfWeek: z.array(z.number().int().min(0).max(6)),
  isActive: z.boolean().optional(),
});

// GET /api/reminders
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const reminders = await prisma.reminder.findMany({
    where: { userId: req.userId! },
    orderBy: { time: 'asc' },
  });
  return res.json(reminders);
});

// POST /api/reminders
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parsed = ReminderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const reminder = await prisma.reminder.create({
    data: {
      userId: req.userId!,
      label: parsed.data.label,
      isMealReminder: parsed.data.isMealReminder ?? false,
      mealType: parsed.data.mealType,
      inputType: parsed.data.inputType ?? 'YES_NO',
      time: parsed.data.time,
      daysOfWeek: parsed.data.daysOfWeek,
      isActive: parsed.data.isActive ?? true,
    },
  });
  return res.status(201).json(reminder);
});

// PATCH /api/reminders/:id
router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  const parsed = ReminderSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const reminder = await prisma.reminder.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

  const updated = await prisma.reminder.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  return res.json(updated);
});

// DELETE /api/reminders/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const reminder = await prisma.reminder.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

  await prisma.reminder.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

// POST /api/reminder-log
router.post('/log', requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    reminderId: z.string().uuid(),
    response: z.string(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const log = await prisma.reminderLog.create({
    data: {
      reminderId: parsed.data.reminderId,
      userId: req.userId!,
      response: parsed.data.response,
    },
  });
  return res.status(201).json(log);
});

export default router;
