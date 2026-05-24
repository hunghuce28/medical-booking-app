/**
 * Root Layout - Expo Router
 * Xử lý font loading, splash screen, và auth navigation
 */

import { useEffect } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import useAuthStore from '../stores/authStore';
import { initDB } from '../services/db';
import { connectSocket, disconnectSocket } from '../services/socket';

export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    // Khôi phục session và khởi tạo SQLite database
    restoreSession();
    initDB();
  }, []);

  useEffect(() => {
    let socket = null;
    if (token) {
      // Kết nối socket
      socket = connectSocket(token);

      // Lắng nghe sự kiện thông báo
      socket.on('notification', (data) => {
        Alert.alert(
          data.title || 'Thông báo mới 🏥',
          data.message,
          [{ text: 'Đồng ý', style: 'default' }]
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
      }
      disconnectSocket();
    };
  }, [token]);

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

