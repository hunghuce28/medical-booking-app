import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
let socket = null;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (socket && socket.disconnected) {
      console.log('[Socket] Network is online, reconnecting...');
      socket.connect();
    }
  });
}

/**
 * Khởi tạo kết nối socket
 * @param {string} token - JWT token để xác thực với backend
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
    console.log('[Socket] Connected to backend server successfully!');
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected from backend server. Reason:', reason);
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
    console.log('[Socket] Disconnected manually.');
  }
};

/**
 * Lấy socket instance hiện tại
 */
export const getSocket = () => socket;
