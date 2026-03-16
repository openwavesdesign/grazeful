import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, MealPlanDay, MealSlot } from '../../store';
import { api } from '../../lib/api';
import { colors } from '../../lib/tokens';
import { HealthScoreDot } from '../../components/HealthScoreDot';

type Tab = 'week' | 'grocery' | 'prep';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEAL_KEYS = ['breakfast', 'lunch', 'dinner'] as const;

export default function MealsScreen() {
  const currentMealPlan = useStore((s) => s.currentMealPlan);
  const setCurrentMealPlan = useStore((s) => s.setCurrentMealPlan);
  const [tab, setTab] = useState<Tab>('week');
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<{
    meal: MealSlot;
    dayIndex: number;
    mealType: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const plan = await api.getCurrentMealPlan() as typeof currentMealPlan;
      setCurrentMealPlan(plan);
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

  async function handleGenerate() {
    setGenerating(true);
    try {
      const plan = await api.generateMealPlan() as typeof currentMealPlan;
      setCurrentMealPlan(plan);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to generate meal plan.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate(dayIndex: number, mealType: string) {
    try {
      const result = await api.regenerateMeal(dayIndex, mealType) as { plan: typeof currentMealPlan };
      setCurrentMealPlan(result.plan);
      setSelectedMeal(null);
      Alert.alert('Done!', 'Meal regenerated successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to regenerate meal.');
    }
  }

  const groceryList = currentMealPlan?.groceryList;
  const prepInstructions = currentMealPlan?.prepInstructions ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-6 pb-2">
        <Text className="text-2xl font-bold text-dark mb-3">Meal Plan</Text>
        {/* Tab selector */}
        <View className="flex-row bg-white border border-border rounded-xl p-1">
          {(['week', 'grocery', 'prep'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg items-center ${tab === t ? 'bg-primary' : ''}`}
            >
              <Text className={`text-sm font-medium ${tab === t ? 'text-white' : 'text-grayText'}`}>
                {t === 'week' ? 'This Week' : t === 'grocery' ? 'Grocery' : 'Prep Guide'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!currentMealPlan && (
          <View className="items-center py-12">
            <Text className="text-grayText text-base mb-4">No meal plan yet.</Text>
            <TouchableOpacity
              className={`bg-primary px-6 py-3 rounded-2xl flex-row items-center gap-2 ${generating ? 'opacity-60' : ''}`}
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating && <ActivityIndicator size="small" color="#fff" />}
              <Text className="text-white font-semibold">Generate Meal Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentMealPlan && tab === 'week' && (
          <View className="pt-4 pb-8">
            {currentMealPlan.planData.days.map((day: MealPlanDay) => (
              <View key={day.dayIndex} className="mb-4">
                <Text className="text-xs font-semibold uppercase text-grayText mb-2">
                  {DAY_NAMES[day.dayIndex]}
                </Text>
                <View className="flex-row gap-2">
                  {MEAL_KEYS.map((key) => {
                    const meal: MealSlot = day[key];
                    return (
                      <TouchableOpacity
                        key={key}
                        className="flex-1 bg-white border border-border rounded-xl p-3"
                        onPress={() =>
                          setSelectedMeal({ meal, dayIndex: day.dayIndex, mealType: key.toUpperCase() })
                        }
                      >
                        <View className="flex-row items-center gap-1 mb-1">
                          <Text className="text-xs text-grayText capitalize">{key}</Text>
                          <HealthScoreDot score={meal.healthScore} size={8} />
                        </View>
                        <Text className="text-xs font-medium text-dark" numberOfLines={2}>
                          {meal.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <TouchableOpacity
              className={`border border-primary rounded-2xl py-3 items-center mt-2 flex-row justify-center gap-2 ${generating ? 'opacity-60' : ''}`}
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating && <ActivityIndicator size="small" color={colors.primary} />}
              <Text className="text-primary font-semibold">Regenerate Full Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentMealPlan && tab === 'grocery' && (
          <View className="pt-4 pb-8">
            {groceryList &&
              Object.entries(groceryList).map(([section, items]) => {
                const itemList = items as string[];
                if (!itemList.length) return null;
                return (
                  <View key={section} className="mb-4">
                    <Text className="text-xs font-semibold uppercase text-grayText mb-2">
                      {section.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    <View className="bg-white border border-border rounded-2xl overflow-hidden">
                      {itemList.map((item: string, i: number) => (
                        <View
                          key={i}
                          className={`flex-row items-center px-4 py-3 ${
                            i < itemList.length - 1 ? 'border-b border-border' : ''
                          }`}
                        >
                          <View className="w-5 h-5 border-2 border-border rounded mr-3" />
                          <Text className="text-base text-dark">{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {currentMealPlan && tab === 'prep' && (
          <View className="pt-4 pb-8">
            <Text className="text-sm text-grayText mb-4">
              Sunday meal prep guide to set your week up for success.
            </Text>
            {prepInstructions.map((step) => (
              <View key={step.step} className="bg-white border border-border rounded-2xl p-4 mb-3">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-8 h-8 bg-primary rounded-full items-center justify-center">
                    <Text className="text-white font-bold text-sm">{step.step}</Text>
                  </View>
                  <Text className="text-base font-semibold text-dark flex-1">{step.title}</Text>
                  <Text className="text-xs text-grayText">{step.estimatedMinutes}m</Text>
                </View>
                <Text className="text-sm text-grayText leading-5">{step.description}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Meal detail sheet */}
      {selectedMeal && (
        <View className="absolute inset-0 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-xs font-semibold uppercase text-grayText">
                {selectedMeal.mealType.charAt(0) + selectedMeal.mealType.slice(1).toLowerCase()}
              </Text>
              <HealthScoreDot score={selectedMeal.meal.healthScore} />
            </View>
            <Text className="text-2xl font-bold text-dark mb-2">{selectedMeal.meal.name}</Text>
            <Text className="text-base text-grayText mb-3">{selectedMeal.meal.description}</Text>
            <View className="flex-row gap-4 mb-4">
              <Text className="text-sm text-grayText">
                ⏱ {selectedMeal.meal.prepTimeMinutes} min
              </Text>
              <Text className="text-sm text-grayText">
                ⭐ {selectedMeal.meal.healthScore}/5
              </Text>
            </View>
            {selectedMeal.meal.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-6">
                {selectedMeal.meal.tags.map((tag) => (
                  <View key={tag} className="bg-primaryLight px-3 py-1 rounded-full">
                    <Text className="text-xs text-primary font-medium">{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-border rounded-2xl py-3 items-center"
                onPress={() => handleRegenerate(selectedMeal.dayIndex, selectedMeal.mealType)}
              >
                <Text className="text-dark font-medium">🔄  Regenerate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-2xl py-3 items-center"
                onPress={() => setSelectedMeal(null)}
              >
                <Text className="text-white font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
