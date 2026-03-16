import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useStore } from '../../store';
import { api, setAuthToken } from '../../lib/api';
import { colors } from '../../lib/tokens';

const STEPS = [
  'Saving your profile…',
  'Generating your first meal plan…',
  'Building your grocery list…',
  'Almost ready!',
];

export default function ReadyScreen() {
  const router = useRouter();
  const { userId: clerkUserId, getToken } = useAuth();
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const setCurrentMealPlan = useStore((s) => s.setCurrentMealPlan);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !clerkUserId) return;
    runSetup();
  }, []);

  async function runSetup() {
    try {
      const token = await getToken();
      setAuthToken(token);

      setStep(0);
      // Create user in DB
      const savedUser = await api.onboard({
        clerkId: clerkUserId,
        email: user!.email || `${clerkUserId}@placeholder.com`,
        name: user!.name,
        currentWeight: user!.currentWeight,
        goalWeight: user!.goalWeight,
        height: user!.height,
        age: user!.age,
        targetPace: user!.targetPace,
        weightUnit: user!.weightUnit,
        dietaryRestrictions: user!.dietaryRestrictions,
        dislikedFoods: user!.dislikedFoods,
        cookTimePreference: user!.cookTimePreference,
        mealPlanPreferences: user!.mealPlanPreferences,
      }) as typeof user;
      setUser(savedUser);

      // Create meal reminders
      const prefs = (user!.mealPlanPreferences || {}) as Record<string, unknown>;
      const mealReminders = (prefs.mealReminders || []) as Array<{
        mealType: string;
        time: string;
        daysOfWeek: number[];
      }>;
      for (const r of mealReminders) {
        await api.createReminder({
          label: `${r.mealType.charAt(0) + r.mealType.slice(1).toLowerCase()} reminder`,
          isMealReminder: true,
          mealType: r.mealType,
          time: r.time,
          daysOfWeek: r.daysOfWeek,
        });
      }

      setStep(1);
      const plan = await api.generateMealPlan() as Parameters<typeof setCurrentMealPlan>[0];
      setCurrentMealPlan(plan);

      setStep(2);
      await new Promise((r) => setTimeout(r, 800)); // brief pause

      setStep(3);
      await new Promise((r) => setTimeout(r, 600));

      router.replace('/(tabs)/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl mb-6">🌿</Text>
        <Text className="text-3xl font-bold text-dark mb-3">
          Welcome, {user?.name || 'there'}!
        </Text>
        <Text className="text-base text-grayText text-center mb-2">
          Your goal: {user?.currentWeight} → {user?.goalWeight} {user?.weightUnit}
        </Text>

        {error ? (
          <View className="mt-8 items-center">
            <Text className="text-error text-base text-center mb-4">{error}</Text>
            <Text className="text-grayText text-sm text-center">
              Please check your connection and try again.
            </Text>
          </View>
        ) : (
          <View className="mt-10 items-center gap-4">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-base text-grayText">{STEPS[step]}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
