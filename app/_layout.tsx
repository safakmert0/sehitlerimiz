import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth';
import { initCache } from '../lib/cache';
import { THEME } from '../lib/theme';

export default function RootLayout() {
  useEffect(() => {
    initCache().catch(console.warn);
  }, []);

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Giriş Yap' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Kayıt Ol' }} />
        <Stack.Screen name="hero/[id]" options={{ title: '' }} />
        <Stack.Screen name="admin/index" options={{ title: 'Moderasyon' }} />
      </Stack>
    </AuthProvider>
  );
}
