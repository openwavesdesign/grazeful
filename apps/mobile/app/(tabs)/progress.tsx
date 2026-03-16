import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, WeightEntry, MealLog } from '../../store';
import { api } from '../../lib/api';
import { colors, scoreConfig } from '../../lib/tokens';
import { HealthScoreDot } from '../../components/HealthScoreDot';

type Range = '2W' | '1M' | '3M' | 'All';
const RANGES: Range[] = ['2W', '1M', '3M', 'All'];

function filterByRange(entries: WeightEntry[], range: Range): WeightEntry[] {
  if (range === 'All') return entries;
  const days = range === '2W' ? 14 : range === '1M' ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return entries.filter((e) => new Date(e.loggedAt) >= cutoff);
}

export default function ProgressScreen() {
  const weightHistory = useStore((s) => s.weightHistory);
  const setWeightHistory = useStore((s) => s.setWeightHistory);
  const user = useStore((s) => s.user);

  const [range, setRange] = useState<Range>('1M');
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [weights, logs] = await Promise.allSettled([
        api.getWeightHistory() as Promise<WeightEntry[]>,
        api.getMealLogs() as Promise<{ logs: MealLog[] }>,
      ]);
      if (weights.status === 'fulfilled') setWeightHistory(weights.value);
      if (logs.status === 'fulfilled') setMealLogs(logs.value.logs);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered = filterByRange(weightHistory, range);
  const goalWeight = user?.goalWeight ?? 0;

  // Normalize entries for mini chart (0–1 scale within range)
  const chartEntries = filtered.slice(-40); // last 40 points
  const minW = Math.min(...chartEntries.map((e) => e.weight), goalWeight) - 2;
  const maxW = Math.max(...chartEntries.map((e) => e.weight)) + 2;
  const normalize = (w: number) => 1 - (w - minW) / (maxW - minW);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text className="text-2xl font-bold text-dark pt-6 pb-4">Progress</Text>

        {/* Range selector */}
        <View className="flex-row gap-2 mb-4">
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              className={`flex-1 py-2 rounded-lg items-center border ${
                range === r ? 'bg-primary border-primary' : 'bg-white border-border'
              }`}
            >
              <Text className={`text-sm font-medium ${range === r ? 'text-white' : 'text-dark'}`}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight chart (SVG-less sparkline using View bars) */}
        <View className="bg-white border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-grayText mb-3 uppercase tracking-wide">
            Weight Chart
          </Text>
          {chartEntries.length > 1 ? (
            <View>
              <View className="flex-row items-end h-32 gap-1">
                {chartEntries.map((entry, i) => {
                  const h = normalize(entry.weight);
                  return (
                    <View
                      key={entry.id}
                      className="flex-1 rounded-sm"
                      style={{
                        height: Math.max(4, h * 120),
                        backgroundColor: colors.primary + 'AA',
                        marginTop: (1 - h) * 120,
                      }}
                    />
                  );
                })}
              </View>
              {/* Goal line indicator */}
              <View className="flex-row justify-between mt-3">
                <Text className="text-xs text-grayText">
                  {new Date(chartEntries[0].loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <View className="flex-row items-center gap-1">
                  <View className="w-4 h-0.5 bg-primary/40" style={{ borderStyle: 'dashed' }} />
                  <Text className="text-xs text-grayText">Goal: {goalWeight} {user?.weightUnit}</Text>
                </View>
                <Text className="text-xs text-grayText">
                  {new Date(chartEntries[chartEntries.length - 1].loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="text-grayText text-center py-8">
              Log a few weight entries to see your chart.
            </Text>
          )}
        </View>

        {/* Check-in history */}
        <Text className="text-base font-semibold text-dark mb-3">Check-In History</Text>
        <View className="bg-white border border-border rounded-2xl overflow-hidden mb-8">
          {mealLogs.length === 0 ? (
            <Text className="text-grayText text-center py-8">No meals logged yet.</Text>
          ) : (
            mealLogs.slice(0, 20).map((log, i) => {
              const sc = scoreConfig.find((s) => s.score === log.healthScore);
              return (
                <View
                  key={log.id}
                  className={`flex-row items-center px-4 py-3 ${
                    i < mealLogs.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <Text className="text-xl mr-3">{sc?.emoji ?? '—'}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-dark">
                      {log.meal?.name || log.customMealName || (log.skipped ? 'Skipped' : 'Meal')}
                    </Text>
                    <Text className="text-xs text-grayText">
                      {log.mealType.charAt(0) + log.mealType.slice(1).toLowerCase()} ·{' '}
                      {new Date(log.loggedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <HealthScoreDot score={log.healthScore} />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
