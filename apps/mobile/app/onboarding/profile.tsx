import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { colors } from '../../lib/tokens';

type TargetPace = 'SLOW' | 'STEADY' | 'ACTIVE';
type WeightUnit = 'LBS' | 'KG';

const PACES: { value: TargetPace; label: string; sub: string }[] = [
  { value: 'SLOW', label: 'Slow & Steady', sub: '0.5 lb/week' },
  { value: 'STEADY', label: 'Steady', sub: '1 lb/week' },
  { value: 'ACTIVE', label: 'Active', sub: '1.5 lb/week' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const setUser = useStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('LBS');
  const [targetPace, setTargetPace] = useState<TargetPace>('STEADY');

  function handleNext() {
    if (!name || !currentWeight || !goalWeight || !height || !age) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    // Save partial profile to store for later submission
    useStore.setState({
      user: {
        id: '',
        clerkId: '',
        email: '',
        name,
        currentWeight: parseFloat(currentWeight),
        goalWeight: parseFloat(goalWeight),
        height: parseInt(height),
        age: parseInt(age),
        targetPace,
        weightUnit,
        dietaryRestrictions: [],
        cookTimePreference: 'MODERATE',
      },
    });

    router.push('/onboarding/eating-style');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-dark mb-2">Your Profile</Text>
        <Text className="text-base text-grayText mb-8">
          Tell us a bit about yourself to get started.
        </Text>

        <Label text="First Name" />
        <TextInput
          className="bg-white border border-border rounded-xl px-4 py-3 text-base text-dark mb-4"
          placeholder="e.g. Alex"
          value={name}
          onChangeText={setName}
        />

        <View className="flex-row gap-4 mb-1">
          <View className="flex-1">
            <Label text="Current Weight" />
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-base text-dark"
              placeholder={weightUnit === 'LBS' ? '180' : '82'}
              keyboardType="numeric"
              value={currentWeight}
              onChangeText={setCurrentWeight}
            />
          </View>
          <View className="flex-1">
            <Label text="Goal Weight" />
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-base text-dark"
              placeholder={weightUnit === 'LBS' ? '160' : '73'}
              keyboardType="numeric"
              value={goalWeight}
              onChangeText={setGoalWeight}
            />
          </View>
        </View>

        {/* Weight unit toggle */}
        <View className="flex-row mb-4 mt-2">
          {(['LBS', 'KG'] as WeightUnit[]).map((unit) => (
            <TouchableOpacity
              key={unit}
              onPress={() => setWeightUnit(unit)}
              className={`flex-1 py-2 items-center rounded-lg mx-1 ${
                weightUnit === unit ? 'bg-primary' : 'bg-white border border-border'
              }`}
            >
              <Text
                className={`font-semibold ${weightUnit === unit ? 'text-white' : 'text-grayText'}`}
              >
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Label text="Height (inches)" />
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-base text-dark"
              placeholder="68"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>
          <View className="flex-1">
            <Label text="Age" />
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-base text-dark"
              placeholder="30"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
          </View>
        </View>

        <Label text="Target Pace" />
        <View className="mb-8">
          {PACES.map((p) => (
            <TouchableOpacity
              key={p.value}
              onPress={() => setTargetPace(p.value)}
              className={`flex-row justify-between items-center border rounded-xl px-4 py-3 mb-2 ${
                targetPace === p.value
                  ? 'bg-primaryLight border-primary'
                  : 'bg-white border-border'
              }`}
            >
              <Text
                className={`font-semibold ${
                  targetPace === p.value ? 'text-primary' : 'text-dark'
                }`}
              >
                {p.label}
              </Text>
              <Text className="text-grayText text-sm">{p.sub}</Text>
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

function Label({ text }: { text: string }) {
  return <Text className="text-xs font-semibold uppercase tracking-wide text-grayText mb-1">{text}</Text>;
}
