import { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { colors } from '../../lib/tokens';

interface MealTimeConfig {
  label: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  defaultTime: string;
  emoji: string;
}

const MEAL_CONFIGS: MealTimeConfig[] = [
  { label: 'Breakfast', mealType: 'BREAKFAST', defaultTime: '08:00', emoji: '🌅' },
  { label: 'Lunch', mealType: 'LUNCH', defaultTime: '12:30', emoji: '☀️' },
  { label: 'Dinner', mealType: 'DINNER', defaultTime: '18:30', emoji: '🌙' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export default function MealTimesScreen() {
  const router = useRouter();
  const [configs, setConfigs] = useState(
    MEAL_CONFIGS.map((m) => ({ ...m, enabled: true, time: m.defaultTime }))
  );

  function updateTime(index: number, time: string) {
    setConfigs((prev) =>
      prev.map((c, i) => (i === index ? { ...c, time } : c))
    );
  }

  function updateEnabled(index: number, enabled: boolean) {
    setConfigs((prev) =>
      prev.map((c, i) => (i === index ? { ...c, enabled } : c))
    );
  }

  function handleNext() {
    // Store meal reminders for creation after user is saved
    useStore.setState((state) => ({
      user: {
        ...state.user!,
        mealPlanPreferences: {
          ...(state.user?.mealPlanPreferences as object || {}),
          mealReminders: configs
            .filter((c) => c.enabled)
            .map((c) => ({
              mealType: c.mealType,
              time: c.time,
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            })),
        },
      },
    }));

    router.push('/onboarding/ready');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-dark mb-2">Meal Times</Text>
        <Text className="text-base text-grayText mb-8">
          When do you usually eat? We'll remind you to check in.
        </Text>

        {configs.map((config, index) => (
          <View
            key={config.mealType}
            className="bg-white border border-border rounded-2xl p-4 mb-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">{config.emoji}</Text>
                <Text className="text-base font-semibold text-dark">{config.label}</Text>
              </View>
              <Switch
                value={config.enabled}
                onValueChange={(v) => updateEnabled(index, v)}
                trackColor={{ true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            {config.enabled && (
              <TimeSelector
                time={config.time}
                onChange={(t) => updateTime(index, t)}
              />
            )}
          </View>
        ))}

        <Text className="text-sm text-grayText text-center mb-8">
          You can always change these in Settings.
        </Text>

        <TouchableOpacity
          className="bg-primary py-4 rounded-2xl items-center mb-8"
          onPress={handleNext}
        >
          <Text className="text-white text-lg font-semibold">Next →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TimeSelector({ time, onChange }: { time: string; onChange: (t: string) => void }) {
  const [hour, minute] = time.split(':');

  return (
    <View className="flex-row gap-2">
      <View className="flex-1">
        <Text className="text-xs text-grayText mb-1">Hour</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {HOURS.map((h) => (
            <TouchableOpacity
              key={h}
              onPress={() => onChange(`${h}:${minute}`)}
              className={`w-10 h-10 rounded-lg items-center justify-center mr-1 ${
                h === hour ? 'bg-primary' : 'bg-background'
              }`}
            >
              <Text className={`text-sm font-medium ${h === hour ? 'text-white' : 'text-dark'}`}>
                {h}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View className="w-24">
        <Text className="text-xs text-grayText mb-1">Minute</Text>
        <View className="flex-row flex-wrap gap-1">
          {MINUTES.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => onChange(`${hour}:${m}`)}
              className={`w-10 h-10 rounded-lg items-center justify-center ${
                m === minute ? 'bg-primary' : 'bg-background'
              }`}
            >
              <Text className={`text-sm font-medium ${m === minute ? 'text-white' : 'text-dark'}`}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
