import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useStore, Reminder } from '../../store';
import { api } from '../../lib/api';
import { colors } from '../../lib/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const reminders = useStore((s) => s.reminders);
  const setReminders = useStore((s) => s.setReminders);

  const [refreshing, setRefreshing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [goalWeight, setGoalWeight] = useState(String(user?.goalWeight ?? ''));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [fetchedUser, fetchedReminders] = await Promise.allSettled([
        api.getMe(),
        api.getReminders(),
      ]);
      if (fetchedUser.status === 'fulfilled') setUser(fetchedUser.value as Parameters<typeof setUser>[0]);
      if (fetchedReminders.status === 'fulfilled') setReminders(fetchedReminders.value as Reminder[]);
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

  async function handleSaveProfile() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await api.updateMe({
        name: name.trim(),
        goalWeight: parseFloat(goalWeight) || user?.goalWeight,
      }) as Parameters<typeof setUser>[0];
      setUser(updated);
      setEditingProfile(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleReminder(id: string, isActive: boolean) {
    try {
      await api.updateReminder(id, { isActive });
      setReminders(reminders.map((r) => (r.id === id ? { ...r, isActive } : r)));
    } catch {}
  }

  async function deleteReminder(id: string) {
    Alert.alert('Delete reminder?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteReminder(id);
            setReminders(reminders.filter((r) => r.id !== id));
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete.');
          }
        },
      },
    ]);
  }

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text className="text-2xl font-bold text-dark pt-6 pb-4">Settings</Text>

        {/* Profile section */}
        <SectionHeader title="Profile" action={editingProfile ? undefined : { label: 'Edit', onPress: () => setEditingProfile(true) }} />
        <View className="bg-white border border-border rounded-2xl p-4 mb-4">
          {editingProfile ? (
            <View className="gap-3">
              <View>
                <Text className="text-xs text-grayText mb-1">Name</Text>
                <TextInput
                  className="border border-border rounded-xl px-3 py-2 text-base text-dark"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View>
                <Text className="text-xs text-grayText mb-1">Goal Weight ({user?.weightUnit})</Text>
                <TextInput
                  className="border border-border rounded-xl px-3 py-2 text-base text-dark"
                  value={goalWeight}
                  onChangeText={setGoalWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-row gap-2 mt-1">
                <TouchableOpacity
                  className="flex-1 border border-border rounded-xl py-2 items-center"
                  onPress={() => setEditingProfile(false)}
                >
                  <Text className="text-grayText font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 rounded-xl py-2 items-center ${saving ? 'bg-gray-300' : 'bg-primary'}`}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <Text className="text-white font-semibold">{saving ? 'Saving…' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="gap-2">
              <InfoRow label="Name" value={user?.name ?? '—'} />
              <InfoRow label="Current Weight" value={`${user?.currentWeight ?? '—'} ${user?.weightUnit ?? ''}`} />
              <InfoRow label="Goal Weight" value={`${user?.goalWeight ?? '—'} ${user?.weightUnit ?? ''}`} />
              <InfoRow label="Height" value={`${user?.height ?? '—'} in`} />
              <InfoRow label="Age" value={String(user?.age ?? '—')} />
              <InfoRow label="Target Pace" value={user?.targetPace ?? '—'} />
            </View>
          )}
        </View>

        {/* Reminders section */}
        <SectionHeader
          title="Reminders"
          action={{ label: '+ Add', onPress: () => router.push('/modals/add-reminder') }}
        />
        <View className="bg-white border border-border rounded-2xl overflow-hidden mb-4">
          {reminders.length === 0 ? (
            <Text className="text-grayText text-center py-6">No reminders yet.</Text>
          ) : (
            reminders.map((r, i) => (
              <View
                key={r.id}
                className={`flex-row items-center px-4 py-3 ${
                  i < reminders.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <View className="flex-1">
                  <Text className="text-base font-medium text-dark">{r.label}</Text>
                  <Text className="text-xs text-grayText">
                    {r.time} · {r.daysOfWeek.map((d) => DAY_NAMES[d]).join(', ')}
                  </Text>
                </View>
                <Switch
                  value={r.isActive}
                  onValueChange={(v) => toggleReminder(r.id, v)}
                  trackColor={{ true: colors.primary }}
                  thumbColor={colors.white}
                />
                <TouchableOpacity
                  className="ml-3 p-1"
                  onPress={() => deleteReminder(r.id)}
                >
                  <Text className="text-error text-base">✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View className="bg-white border border-border rounded-2xl p-4 mb-4">
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Model" value="claude-sonnet-4-20250514" />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          className="border border-error rounded-2xl py-4 items-center mb-8"
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
            ]);
          }}
        >
          <Text className="text-error font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View className="flex-row justify-between items-center mb-2">
      <Text className="text-xs font-semibold uppercase tracking-wide text-grayText">{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text className="text-sm text-primary font-semibold">{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-grayText">{label}</Text>
      <Text className="text-sm font-medium text-dark">{value}</Text>
    </View>
  );
}
