import { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, MealLog, MealPlanDay } from '../../store';
import { api } from '../../lib/api';
import { colors, scoreConfig } from '../../lib/tokens';
import { projectGoalDate } from '../../lib/projection';
import { HealthScoreDot } from '../../components/HealthScoreDot';
import { useState } from 'react';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;
type MealType = typeof MEAL_TYPES[number];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getCheckInStatus(logs: MealLog[], mealType: MealType): 'logged' | 'skipped' | 'pending' {
  const log = logs.find((l) => l.mealType === mealType);
  if (!log) return 'pending';
  if (log.skipped) return 'skipped';
  return 'logged';
}

const STATUS_BADGES: Record<string, { emoji: string; label: string; bg: string }> = {
  logged: { emoji: '✅', label: 'Logged', bg: 'bg-primaryLight' },
  skipped: { emoji: '⏭️', label: 'Skipped', bg: 'bg-gray-100' },
  pending: { emoji: '⏳', label: 'Pending', bg: 'bg-yellow-50' },
};

export default function HomeScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const currentMealPlan = useStore((s) => s.currentMealPlan);
  const todayLogs = useStore((s) => s.todayLogs);
  const weightHistory = useStore((s) => s.weightHistory);
  const setTodayLogs = useStore((s) => s.setTodayLogs);
  const setCurrentMealPlan = useStore((s) => s.setCurrentMealPlan);
  const setWeightHistory = useStore((s) => s.setWeightHistory);
  const [refreshing, setRefreshing] = useState(false);
  const [weekScores, setWeekScores] = useState<(number | null)[]>(Array(7).fill(null));

  const load = useCallback(async () => {
    try {
      const [logs, plan, weights] = await Promise.allSettled([
        api.getTodayLogs() as Promise<MealLog[]>,
        api.getCurrentMealPlan() as Promise<typeof currentMealPlan>,
        api.getWeightHistory() as Promise<typeof weightHistory>,
      ]);

      if (logs.status === 'fulfilled') setTodayLogs(logs.value);
      if (plan.status === 'fulfilled') setCurrentMealPlan(plan.value);
      if (weights.status === 'fulfilled') setWeightHistory(weights.value as typeof weightHistory);

      // Compute weekly health scores
      buildWeekScores(logs.status === 'fulfilled' ? logs.value : []);
    } catch {}
  }, []);

  async function buildWeekScores(logs: MealLog[]) {
    const scores: (number | null)[] = Array(7).fill(null);
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    logs.forEach((log) => {
      const d = new Date(log.loggedAt).getDay();
      const idx = (d - (dayOfWeek - 6) + 7) % 7;
      if (scores[idx] === null) scores[idx] = log.healthScore;
      else scores[idx] = Math.round(((scores[idx] as number) + log.healthScore) / 2);
    });
    setWeekScores(scores);
  }

  useEffect(() => {
    load();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const today = new Date();
  const todayDayIndex = today.getDay(); // 0=Sun
  const todayPlan = currentMealPlan?.planData?.days?.[todayDayIndex] as MealPlanDay | undefined;

  const projectedDate =
    weightHistory.length > 0 && user
      ? projectGoalDate(
          weightHistory.map((e) => ({ weight: e.weight, loggedAt: e.loggedAt })),
          user.goalWeight,
          user.targetPace
        )
      : null;

  const lbsRemaining =
    user ? Math.max(0, Math.round((user.currentWeight - user.goalWeight) * 10) / 10) : 0;

  // Simple streak: count consecutive days with logs from today backwards
  const streak = (() => {
    if (todayLogs.length === 0) return 0;
    return 1; // simplified — full streak computation is in API
  })();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Greeting */}
        <View className="pt-6 pb-4">
          <Text className="text-2xl font-bold text-dark">
            {getGreeting()}, {user?.name || ''}!
          </Text>
          <Text className="text-sm text-grayText mt-1">{formatDate(today)}</Text>
        </View>

        {/* Weight Snapshot */}
        <TouchableOpacity
          className="bg-white border border-border rounded-2xl p-4 mb-4"
          onPress={() => router.push('/modals/weight-log')}
        >
          <Text className="text-xs font-semibold uppercase tracking-wide text-grayText mb-3">
            Weight Snapshot
          </Text>
          <View className="flex-row justify-between">
            <Stat label="Current" value={`${user?.currentWeight ?? '—'} ${user?.weightUnit ?? 'LBS'}`} />
            <Stat label="Goal" value={`${user?.goalWeight ?? '—'} ${user?.weightUnit ?? 'LBS'}`} />
            <Stat label="To Go" value={`${lbsRemaining} lbs`} />
            <Stat
              label="Est. Date"
              value={
                projectedDate && isFinite(projectedDate.getTime())
                  ? projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—'
              }
            />
          </View>
        </TouchableOpacity>

        {/* Today's Meals */}
        <Text className="text-base font-semibold text-dark mb-3">Today's Meals</Text>
        <View className="gap-3 mb-4">
          {MEAL_TYPES.map((mealType) => {
            const mealKey = mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
            const meal = todayPlan?.[mealKey];
            const status = getCheckInStatus(todayLogs, mealType);
            const badge = STATUS_BADGES[status];
            return (
              <TouchableOpacity
                key={mealType}
                className={`bg-white border border-border rounded-2xl p-4 flex-row items-center justify-between`}
                onPress={() =>
                  router.push({
                    pathname: '/modals/meal-checkin',
                    params: { mealType },
                  })
                }
              >
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-grayText mb-1">
                    {mealType.charAt(0) + mealType.slice(1).toLowerCase()}
                  </Text>
                  <Text className="text-base font-semibold text-dark" numberOfLines={1}>
                    {meal?.name || 'No meal planned'}
                  </Text>
                  {meal && (
                    <Text className="text-sm text-grayText mt-0.5" numberOfLines={1}>
                      {meal.description}
                    </Text>
                  )}
                </View>
                <View className={`ml-3 px-3 py-1 rounded-full ${badge.bg}`}>
                  <Text className="text-xs font-medium text-dark">
                    {badge.emoji} {badge.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Log Weight */}
        <TouchableOpacity
          className="bg-primaryLight border border-primary rounded-2xl py-3 items-center mb-4"
          onPress={() => router.push('/modals/weight-log')}
        >
          <Text className="text-primary font-semibold">⚖️  Quick Log Weight</Text>
        </TouchableOpacity>

        {/* Streak */}
        {streak > 0 && (
          <View className="bg-warning/10 border border-warning/30 rounded-2xl px-4 py-3 mb-4 flex-row items-center gap-2">
            <Text className="text-2xl">🔥</Text>
            <Text className="text-base font-semibold text-dark">{streak}-day streak — keep it up!</Text>
          </View>
        )}

        {/* Weekly health score bar */}
        <Text className="text-base font-semibold text-dark mb-3">This Week</Text>
        <View className="bg-white border border-border rounded-2xl p-4 mb-8">
          <View className="flex-row justify-between">
            {DAY_LABELS.map((label, i) => {
              const score = weekScores[i];
              return (
                <View key={i} className="items-center gap-2">
                  <View
                    className="w-8 rounded-lg items-center justify-center"
                    style={{
                      height: 40,
                      backgroundColor: score
                        ? scoreConfig.find((s) => s.score === score)?.color + '33'
                        : colors.border,
                    }}
                  >
                    {score ? <HealthScoreDot score={score} size={12} /> : null}
                  </View>
                  <Text className="text-xs text-grayText">{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-xs text-grayText mb-1">{label}</Text>
      <Text className="text-sm font-semibold text-dark">{value}</Text>
    </View>
  );
}
