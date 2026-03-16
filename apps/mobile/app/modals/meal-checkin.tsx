import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, MealLog } from '../../store';
import { api } from '../../lib/api';
import { scoreConfig } from '../../lib/tokens';

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
type FeelingScore = 'ENERGIZED' | 'NORMAL' | 'SLUGGISH' | 'HUNGRY';
type Step = 1 | 2 | 3 | 'done';

const FEELING_OPTIONS: { value: FeelingScore; label: string; emoji: string }[] = [
  { value: 'ENERGIZED', label: 'Energized', emoji: '⚡' },
  { value: 'NORMAL', label: 'Normal', emoji: '😊' },
  { value: 'SLUGGISH', label: 'Sluggish', emoji: '😴' },
  { value: 'HUNGRY', label: 'Hungry', emoji: '🍽️' },
];

export default function MealCheckinModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: MealType }>();
  const mealType: MealType = params.mealType || 'BREAKFAST';

  const currentMealPlan = useStore((s) => s.currentMealPlan);
  const todayLogs = useStore((s) => s.todayLogs);
  const addTodayLog = useStore((s) => s.addTodayLog);

  const today = new Date().getDay();
  const todayPlan = currentMealPlan?.planData?.days?.[today];
  const plannedMeal = todayPlan?.[mealType.toLowerCase() as 'breakfast' | 'lunch' | 'dinner'];

  // Recent meals from logs (last 10 unique names)
  const recentMeals = Array.from(
    new Set(
      todayLogs
        .filter((l) => !l.skipped && l.mealType !== mealType)
        .map((l) => l.meal?.name || l.customMealName)
        .filter(Boolean)
    )
  ).slice(0, 10) as string[];

  const [step, setStep] = useState<Step>(1);
  const [selectedMealName, setSelectedMealName] = useState<string | null>(null);
  const [customMeal, setCustomMeal] = useState('');
  const [skipped, setSkipped] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [feelingScore, setFeelingScore] = useState<FeelingScore | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      const log = await api.logMeal({
        mealType,
        healthScore: skipped ? 3 : healthScore!,
        feelingScore: feelingScore || undefined,
        customMealName: customMeal || undefined,
        wasPlanned: selectedMealName === plannedMeal?.name,
        skipped,
      }) as MealLog;
      addTodayLog(log);
      setStep('done');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to log meal.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSkipped(true);
    setSaving(true);
    try {
      const log = await api.logMeal({
        mealType,
        healthScore: 3,
        skipped: true,
      }) as MealLog;
      addTodayLog(log);
      setStep('done');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to log.');
    } finally {
      setSaving(false);
    }
  }

  const mealLabel = mealType.charAt(0) + mealType.slice(1).toLowerCase();

  if (step === 'done') {
    const isLowScore = healthScore === 1;
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-5xl mb-4">{skipped ? '⏭️' : '✅'}</Text>
        <Text className="text-2xl font-bold text-dark text-center mb-3">
          {skipped ? 'Got it, no worries!' : 'Nice work!'}
        </Text>
        {isLowScore && (
          <Text className="text-base text-grayText text-center mb-4">
            Everyone deserves a treat — enjoy it guilt-free!
          </Text>
        )}
        {!isLowScore && !skipped && (
          <Text className="text-base text-grayText text-center mb-4">
            Your {mealLabel} has been logged.
          </Text>
        )}
        <TouchableOpacity
          className="bg-primary py-3 px-8 rounded-2xl mt-4"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold text-base">Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <Text className="text-lg font-bold text-dark">{mealLabel} Check-in</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-grayText">Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <View className="flex-row px-6 gap-1 mb-4">
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              className={`flex-1 h-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <View>
              <Text className="text-xl font-bold text-dark mb-6">What did you eat?</Text>

              {/* Planned meal */}
              {plannedMeal && (
                <TouchableOpacity
                  className={`border-2 rounded-2xl p-4 mb-3 ${
                    selectedMealName === plannedMeal.name
                      ? 'border-primary bg-primaryLight'
                      : 'border-border bg-white'
                  }`}
                  onPress={() => setSelectedMealName(plannedMeal.name)}
                >
                  <Text className="text-xs font-semibold uppercase text-grayText mb-1">
                    Today's Plan
                  </Text>
                  <Text className="text-base font-semibold text-dark">{plannedMeal.name}</Text>
                  <Text className="text-sm text-grayText mt-1">{plannedMeal.description}</Text>
                </TouchableOpacity>
              )}

              {/* Recent meals */}
              {recentMeals.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                  <View className="flex-row gap-2">
                    {recentMeals.map((name) => (
                      <TouchableOpacity
                        key={name}
                        onPress={() => setSelectedMealName(name)}
                        className={`px-4 py-2 rounded-full border ${
                          selectedMealName === name ? 'bg-primary border-primary' : 'bg-white border-border'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            selectedMealName === name ? 'text-white' : 'text-dark'
                          }`}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}

              {/* Something else */}
              <TextInput
                className="bg-white border border-border rounded-xl px-4 py-3 text-base text-dark mb-4"
                placeholder="Something else? Type it here (optional)"
                value={customMeal}
                onChangeText={(v) => {
                  setCustomMeal(v);
                  if (v) setSelectedMealName(null);
                }}
              />

              <View className="gap-3 mt-2">
                <TouchableOpacity
                  className={`py-4 rounded-2xl items-center ${
                    selectedMealName || customMeal ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  onPress={() => (selectedMealName || customMeal) && setStep(2)}
                  disabled={!selectedMealName && !customMeal}
                >
                  <Text className="text-white font-semibold text-base">Next →</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="py-3 rounded-2xl items-center border border-border"
                  onPress={handleSkip}
                  disabled={saving}
                >
                  <Text className="text-grayText font-medium">⏭️  Skipped this meal</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text className="text-xl font-bold text-dark mb-6">How healthy was it?</Text>
              <View className="gap-3 mb-6">
                {scoreConfig.map((sc) => (
                  <TouchableOpacity
                    key={sc.score}
                    onPress={() => setHealthScore(sc.score)}
                    className={`flex-row items-center gap-3 border-2 rounded-2xl px-4 py-3 ${
                      healthScore === sc.score ? 'border-primary bg-primaryLight' : 'border-border bg-white'
                    }`}
                  >
                    <Text className="text-2xl">{sc.emoji}</Text>
                    <View>
                      <Text className="font-semibold text-dark">{sc.score} — {sc.label}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                className={`py-4 rounded-2xl items-center ${healthScore ? 'bg-primary' : 'bg-gray-200'}`}
                onPress={() => healthScore && setStep(3)}
                disabled={!healthScore}
              >
                <Text className="text-white font-semibold text-base">Next →</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text className="text-xl font-bold text-dark mb-2">How do you feel?</Text>
              <Text className="text-sm text-grayText mb-6">Optional — tap one or skip.</Text>
              <View className="flex-row flex-wrap gap-3 mb-8">
                {FEELING_OPTIONS.map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    onPress={() =>
                      setFeelingScore(feelingScore === f.value ? null : f.value)
                    }
                    className={`flex-row items-center gap-2 border-2 rounded-2xl px-4 py-3 ${
                      feelingScore === f.value ? 'border-primary bg-primaryLight' : 'border-border bg-white'
                    }`}
                  >
                    <Text className="text-xl">{f.emoji}</Text>
                    <Text className="font-medium text-dark">{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                className={`py-4 rounded-2xl items-center ${saving ? 'bg-gray-300' : 'bg-primary'}`}
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text className="text-white font-semibold text-base">
                  {saving ? 'Saving…' : 'Log Meal ✓'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 items-center mt-2"
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text className="text-grayText">Skip feeling</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
