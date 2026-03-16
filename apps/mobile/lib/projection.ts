type WeightEntry = { weight: number; loggedAt: string | Date };
type TargetPace = 'SLOW' | 'STEADY' | 'ACTIVE';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

function calculateLinearRegressionSlope(entries: WeightEntry[]): number {
  const n = entries.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = entries.reduce((sum, e) => sum + e.weight, 0) / n;
  let num = 0;
  let den = 0;
  entries.forEach((e, i) => {
    num += (i - xMean) * (e.weight - yMean);
    den += (i - xMean) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

export function projectGoalDate(
  entries: WeightEntry[],
  goalWeight: number,
  targetPace: TargetPace
): Date {
  if (entries.length < 7) {
    const pacePerWeek =
      targetPace === 'SLOW' ? 0.5 : targetPace === 'STEADY' ? 1.0 : 1.5;
    const currentWeight = entries[entries.length - 1]?.weight ?? 0;
    const lbsToGo = currentWeight - goalWeight;
    const weeksToGo = lbsToGo / pacePerWeek;
    return addWeeks(new Date(), weeksToGo);
  }
  const recent = entries.slice(-14);
  const slope = calculateLinearRegressionSlope(recent);
  const current = recent[recent.length - 1].weight;
  const daysToGo = slope === 0 ? Infinity : (current - goalWeight) / Math.abs(slope);
  return addDays(new Date(), daysToGo);
}
