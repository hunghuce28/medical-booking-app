/**
 * Root Layout - Expo Router
 * Xử lý font loading, splash screen, và auth navigation
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import useAuthStore from '../stores/authStore';
import { initDB } from '../services/db';

export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    // Khôi phục session và khởi tạo SQLite database
    restoreSession();
    initDB();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
