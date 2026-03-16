import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store';

const BREAKFAST_OPTIONS = ['Eggs', 'Smoothies', 'Fruit', 'Oatmeal', 'Yogurt', 'Other'];
const LUNCH_OPTIONS = ['Sandwiches', 'Salads', 'Leftovers', 'Soup', 'Other'];
const DIETARY = ['Low sodium', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'None'];
const COOK_TIME = [
  { value: 'QUICK' as const, label: 'Quick', sub: 'Under 10 min' },
  { value: 'MODERATE' as const, label: 'Moderate', sub: '10–30 min' },
  { value: 'FULL' as const, label: 'Full cook', sub: '30+ min' },
];

type CookTime = 'QUICK' | 'MODERATE' | 'FULL';

export default function EatingStyleScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);

  const [breakfast, setBreakfast] = useState<string[]>([]);
  const [lunch, setLunch] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState('');
  const [cookTime, setCookTime] = useState<CookTime>('MODERATE');

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  function handleNext() {
    // Map display labels to API values
    const restrictions = dietary
      .filter((d) => d !== 'None')
      .map((d) => d.toLowerCase().replace(' ', '-'));

    useStore.setState({
      user: {
        ...user!,
        dietaryRestrictions: restrictions,
        dislikedFoods: dislikedFoods || null,
        cookTimePreference: cookTime,
        mealPlanPreferences: {
          breakfastPreferences: breakfast,
          lunchPreferences: lunch,
        },
      },
    });

    router.push('/onboarding/meal-times');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-dark mb-2">Your Eating Style</Text>
        <Text className="text-base text-grayText mb-8">
          Help us personalize your meal plan.
        </Text>

        <SectionLabel text="What do you usually eat for breakfast?" />
        <ChipGroup options={BREAKFAST_OPTIONS} selected={breakfast} onToggle={(v) => toggle(breakfast, setBreakfast, v)} />

        <SectionLabel text="What about lunch?" />
        <ChipGroup options={LUNCH_OPTIONS} selected={lunch} onToggle={(v) => toggle(lunch, setLunch, v)} />

        <SectionLabel text="Dietary restrictions" />
        <ChipGroup options={DIETARY} selected={dietary} onToggle={(v) => toggle(dietary, setDietary, v)} />

        <SectionLabel text="Any foods you dislike? (optional)" />
        <TextInput
          className="bg-white border border-border rounded-xl px-4 py-3 text-base text-dark mb-6"
          placeholder="e.g. Swiss cheese, olives"
          value={dislikedFoods}
          onChangeText={setDislikedFoods}
        />

        <SectionLabel text="Cook time preference" />
        <View className="flex-row gap-2 mb-8">
          {COOK_TIME.map((ct) => (
            <TouchableOpacity
              key={ct.value}
              onPress={() => setCookTime(ct.value)}
              className={`flex-1 border rounded-xl p-3 items-center ${
                cookTime === ct.value ? 'bg-primaryLight border-primary' : 'bg-white border-border'
              }`}
            >
              <Text className={`font-semibold text-sm ${cookTime === ct.value ? 'text-primary' : 'text-dark'}`}>
                {ct.label}
              </Text>
              <Text className="text-grayText text-xs mt-1">{ct.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

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

function SectionLabel({ text }: { text: string }) {
  return <Text className="text-base font-semibold text-dark mb-3">{text}</Text>;
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2 mb-6">
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => onToggle(opt)}
          className={`px-4 py-2 rounded-full border ${
            selected.includes(opt)
              ? 'bg-primary border-primary'
              : 'bg-white border-border'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              selected.includes(opt) ? 'text-white' : 'text-dark'
            }`}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
