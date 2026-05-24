/**
 * API Configuration
 * Axios instance với base URL và interceptor token
 */

import axios from 'axios';
import { Platform } from 'react-native';
import storage from './storage';

// Tự động chọn BASE_URL theo nền tảng
// - Web (Expo Web): dùng localhost
// - Android Emulator: dùng 10.0.2.2 (alias localhost trên emulator)
// - Thiết bị thật: dùng IP máy tính trong mạng LAN
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  if (Platform.OS === 'android') {
    return 'http://192.168.50.203:5000/api'; // ← Đổi thành IP máy bạn khi dùng thiết bị thật
  }
  return 'http://localhost:5000/api'; // iOS Simulator
};

const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cờ để chống gọi refresh liên tục khi có nhiều request cùng lúc bị 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor - Tự động gắn token vào header
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Xử lý lỗi chung và tự động refresh token
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Server trả về lỗi 401 (Unauthorized) và chưa từng thử lại
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh dở, cho các request khác vào hàng đợi
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Gọi API refresh token
        const res = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
        const newAccessToken = res.data.data?.accessToken || res.data.accessToken;
        const newRefreshToken = res.data.data?.refreshToken || res.data.refreshToken;

        // Lưu token mới
        await storage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          await storage.setItem('refreshToken', newRefreshToken);
        }

        processQueue(null, newAccessToken);

        // Gắn token mới vào request ban đầu và gọi lại
        originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Nếu refresh thất bại, xóa token (có thể dispatch sự kiện để UI logout)
        await storage.deleteItem('accessToken');
        await storage.deleteItem('refreshToken');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      const { status, data } = error.response;
      return Promise.reject({
        status,
        message: data?.message || 'Có lỗi xảy ra',
        errors: data?.errors,
      });
    } else if (error.request) {
      return Promise.reject({
        status: 0,
        message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
