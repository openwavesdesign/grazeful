import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { colors } from '../../lib/tokens';

export default function WeightLogModal() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const addWeightEntry = useStore((s) => s.addWeightEntry);
  const setUser = useStore((s) => s.setUser);

  const [weight, setWeight] = useState(String(user?.currentWeight ?? ''));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const val = parseFloat(weight);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid weight', 'Please enter a valid weight.');
      return;
    }

    setSaving(true);
    try {
      const entry = await api.logWeight({ weight: val, note: note || undefined }) as {
        id: string;
        userId: string;
        weight: number;
        loggedAt: string;
        note?: string | null;
      };
      addWeightEntry(entry);
      if (user) setUser({ ...user, currentWeight: val });
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save weight.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <Text className="text-xl font-bold text-dark">Log Weight</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-grayText text-base">Cancel</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6 pt-8 items-center">
          <Text className="text-base text-grayText mb-6">
            Last logged: {user?.currentWeight} {user?.weightUnit}
          </Text>

          <View className="flex-row items-end gap-2 mb-8">
            <TextInput
              className="text-6xl font-bold text-dark text-center border-b-2 border-primary pb-2 w-48"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              selectTextOnFocus
              autoFocus
            />
            <Text className="text-2xl text-grayText mb-3">{user?.weightUnit ?? 'LBS'}</Text>
          </View>

          <View className="w-full mb-8">
            <Text className="text-sm text-grayText mb-2">Note (optional)</Text>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-base text-dark"
              placeholder="e.g. After morning workout"
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-2xl items-center ${saving ? 'bg-gray-300' : 'bg-primary'}`}
            onPress={handleSave}
            disabled={saving}
          >
            <Text className="text-white text-lg font-semibold">
              {saving ? 'Saving…' : 'Save Weight'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
