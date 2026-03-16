import { Tabs } from 'expo-router';
import { colors } from '../../lib/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="meals"
        options={{ title: 'Meals', tabBarIcon: ({ color }) => <TabIcon emoji="🍽️" color={color} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}
