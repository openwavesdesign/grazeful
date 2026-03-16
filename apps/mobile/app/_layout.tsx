import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useStore } from '../store';
import { api, setAuthToken } from '../lib/api';

const CLERK_PUBLISHABLE_KEY =
  (Constants.expoConfig?.extra?.clerkPublishableKey as string) ||
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  '';

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

function AuthGate() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const setUser = useStore((s) => s.setUser);

  useEffect(() => {
    if (!isLoaded) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';

    if (!isSignedIn) {
      // Not signed in — go to welcome
      if (!inOnboarding) router.replace('/onboarding/welcome');
    } else {
      // Signed in — fetch user profile and sync token
      (async () => {
        const token = await getToken();
        setAuthToken(token);

        try {
          const user = await api.getMe() as ReturnType<typeof api.getMe> extends Promise<infer U> ? U : never;
          setUser(user as Parameters<typeof setUser>[0]);
          if (!inTabs) router.replace('/(tabs)/');
        } catch {
          // User not onboarded yet
          if (!inOnboarding) router.replace('/onboarding/welcome');
        }
      })();
    }
  }, [isLoaded, isSignedIn]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="modals/meal-checkin" options={{ presentation: 'modal' }} />
      <Stack.Screen name="modals/weight-log" options={{ presentation: 'modal' }} />
      <Stack.Screen name="modals/add-reminder" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <AuthGate />
    </ClerkProvider>
  );
}
