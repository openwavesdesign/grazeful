import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import weightRoutes from './routes/weight';
import mealPlanRoutes from './routes/mealPlan';
import mealLogRoutes from './routes/mealLog';
import reminderRoutes from './routes/reminders';
import summaryRoutes from './routes/summary';
import userRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.use('/api/users', userRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/meal-log', mealLogRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/reminder-log', reminderRoutes); // reminder log endpoint is on the same router
app.use('/api/summary', summaryRoutes);

app.listen(PORT, () => {
  console.log(`Grazeful API running on http://localhost:${PORT}`);
});
