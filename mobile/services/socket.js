import { io } from 'socket.io-client';
import { Platform } from 'react-native';

// Tự động chọn SOCKET_URL theo nền tảng (giống getBaseUrl của api.js)
const getSocketUrl = () => {
  // Ở đây chúng ta hardcode hoặc lấy IP tương ứng từ api.js
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  if (Platform.OS === 'android') {
    return 'http://192.168.50.203:5000'; // IP máy tính trong mạng LAN
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();
let socket = null;

/**
 * Khởi tạo kết nối socket cho Mobile
 * @param {string} token - JWT Access Token
 */
export const connectSocket = (token) => {
  if (socket && socket.connected) return socket;

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
