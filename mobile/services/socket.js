import { io } from 'socket.io-client';
import { Platform, AppState } from 'react-native';
import Constants from 'expo-constants';

// Tự động chọn SOCKET_URL theo nền tảng (giống getBaseUrl của api.js)
const getSocketUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000`;
  }
  return 'http://192.168.1.100:5000'; // Fallback
};

const SOCKET_URL = getSocketUrl();
let socket = null;

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active' && socket && socket.disconnected) {
    console.log('[Socket Mobile] App became active, reconnecting...');
    socket.connect();
  }
});

/**
 * Khởi tạo kết nối socket cho Mobile
 * @param {string} token - JWT Access Token
 */
export const connectSocket = (token) => {
  if (socket) {
    if (socket.connected) return socket;
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log('[Socket Mobile] Connected successfully!');
  });

  socket.on('connect_error', (error) => {
    console.log('[Socket Mobile] Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket Mobile] Disconnected. Reason:', reason);
  });

  return socket;
};

/**
 * Ngắt kết nối socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket Mobile] Disconnected manually.');
  }
};

/**
 * Lấy socket instance hiện tại
 */
export const getSocket = () => socket;
