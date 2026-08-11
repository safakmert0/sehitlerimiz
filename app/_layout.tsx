import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../lib/auth';
import { initCache } from '../lib/cache';
import { THEME } from '../lib/theme';
import {
  isOnboardingDone,
  setOnboardingDone,
  subscribeOnboardingDone,
} from '../lib/onboardingGate';
import { ONBOARDING_DONE_KEY } from './onboarding';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [onboardingDone, setOnboardingDoneState] = useState(isOnboardingDone());
  const navigatedRef = useRef(false);

  useEffect(() => {
    initCache().catch(console.warn);
    const unsubscribe = subscribeOnboardingDone(setOnboardingDoneState);
    if (!navigatedRef.current) {
      navigatedRef.current = true;
      AsyncStorage.getItem(ONBOARDING_DONE_KEY)
        .then((v) => {
          if (v === '1') setOnboardingDone(true);
        })
        .catch(() => setOnboardingDone(true))
        .finally(() => setReady(true));
    }
    return unsubscribe;
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: THEME.colors.background }} />;
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: THEME.colors.primary },
          headerTintColor: THEME.colors.white,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: THEME.colors.background },
        }}
      >
        <Stack.Protected guard={onboardingDone}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ title: 'Giriş Yap' }} />
          <Stack.Screen name="auth/register" options={{ title: 'Kayıt Ol' }} />
          <Stack.Screen name="hero/[id]" options={{ title: '' }} />
          <Stack.Screen name="admin/index" options={{ title: 'Moderasyon' }} />
        </Stack.Protected>
        <Stack.Protected guard={!onboardingDone}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </AuthProvider>
  );
}