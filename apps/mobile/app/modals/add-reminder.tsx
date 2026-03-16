import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, Reminder } from '../../store';
import { api } from '../../lib/api';
import { colors } from '../../lib/tokens';

type InputType = 'YES_NO' | 'COUNT' | 'RATING';

const INPUT_TYPES: { value: InputType; label: string; sub: string }[] = [
  { value: 'YES_NO', label: 'Yes / No', sub: 'Did you do it?' },
  { value: 'COUNT', label: 'Count', sub: 'How many times?' },
  { value: 'RATING', label: 'Rating 1–5', sub: 'How well did it go?' },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function AddReminderModal() {
  const router = useRouter();
  const setReminders = useStore((s) => s.setReminders);
  const reminders = useStore((s) => s.reminders);

  const [label, setLabel] = useState('');
  const [inputType, setInputType] = useState<InputType>('YES_NO');
  const [time, setTime] = useState('08:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [saving, setSaving] = useState(false);

  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');

  function toggleDay(d: number) {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  async function handleSave() {
    if (!label.trim()) {
      Alert.alert('Missing label', 'Please enter a label for this reminder.');
      return;
    }
    if (daysOfWeek.length === 0) {
      Alert.alert('No days selected', 'Select at least one day.');
      return;
    }

    const reminderTime = `${hour}:${minute}`;

    setSaving(true);
    try {
      const reminder = await api.createReminder({
        label: label.trim(),
        inputType,
        time: reminderTime,
        daysOfWeek,
      }) as Reminder;
      setReminders([...reminders, reminder]);
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save reminder.');
    } finally {
      setSaving(false);
    }
  }

  const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const MINUTES = ['00', '15', '30', '45'];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Text className="text-xl font-bold text-dark">Add Reminder</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-grayText">Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-xs font-semibold uppercase text-grayText mb-1 mt-4">Label</Text>
        <TextInput
          className="bg-white border border-border rounded-xl px-4 py-3 text-base text-dark mb-6"
          placeholder="e.g. Took my vitamins?"
          value={label}
          onChangeText={setLabel}
          autoFocus
        />

        <Text className="text-xs font-semibold uppercase text-grayText mb-2">Response Type</Text>
        <View className="gap-2 mb-6">
          {INPUT_TYPES.map((it) => (
            <TouchableOpacity
              key={it.value}
              onPress={() => setInputType(it.value)}
              className={`flex-row justify-between items-center border rounded-xl px-4 py-3 ${
                inputType === it.value ? 'bg-primaryLight border-primary' : 'bg-white border-border'
              }`}
            >
              <Text className={`font-semibold ${inputType === it.value ? 'text-primary' : 'text-dark'}`}>
                {it.label}
              </Text>
              <Text className="text-grayText text-sm">{it.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-xs font-semibold uppercase text-grayText mb-2">Time</Text>
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="text-xs text-grayText mb-1">Hour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1">
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setHour(h)}
                    className={`w-10 h-10 rounded-lg items-center justify-center ${
                      h === hour ? 'bg-primary' : 'bg-white border border-border'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${h === hour ? 'text-white' : 'text-dark'}`}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View>
            <Text className="text-xs text-grayText mb-1">Min</Text>
            <View className="gap-1">
              {MINUTES.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMinute(m)}
                  className={`w-12 h-10 rounded-lg items-center justify-center ${
                    m === minute ? 'bg-primary' : 'bg-white border border-border'
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

        <Text className="text-xs font-semibold uppercase text-grayText mb-2">Days</Text>
        <View className="flex-row gap-2 mb-8">
          {DAY_LABELS.map((label, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => toggleDay(i)}
              className={`flex-1 h-10 rounded-xl items-center justify-center ${
                daysOfWeek.includes(i) ? 'bg-primary' : 'bg-white border border-border'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${daysOfWeek.includes(i) ? 'text-white' : 'text-grayText'}`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className={`py-4 rounded-2xl items-center mb-8 ${saving ? 'bg-gray-300' : 'bg-primary'}`}
          onPress={handleSave}
          disabled={saving}
        >
          <Text className="text-white font-semibold text-base">
            {saving ? 'Saving…' : 'Save Reminder'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
