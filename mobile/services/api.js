/**
 * API Configuration
 * Axios instance với base URL và interceptor token
 */

import axios from 'axios';
import { Platform } from 'react-native';
import storage from './storage';
import useAuthStore from '../stores/authStore';

import Constants from 'expo-constants';

// Tự động chọn BASE_URL theo nền tảng
// - Web (Expo Web): dùng localhost
// - Expo Go trên điện thoại thật: Tự động lấy IP của máy tính đang phát Expo
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  // Lấy IP LAN của máy tính tự động từ cấu hình Expo
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  // Fallback nếu chạy build độc lập
  return 'http://192.168.50.203:5000/api';
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

    // Bỏ qua interceptor nếu là API đăng nhập / đăng ký để lấy được lỗi sai mật khẩu
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/register')) {
      return Promise.reject({
        status: error.response?.status || 400,
        message: error.response?.data?.message || 'Có lỗi xảy ra',
      });
    }

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
        // Nếu refresh thất bại, xóa token và đăng xuất UI
        await storage.deleteItem('accessToken');
        await storage.deleteItem('refreshToken');
        useAuthStore.getState().logout();
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

export const getFullImageUrl = (dbUrl) => {
  if (!dbUrl) return null;
  // Lấy đường dẫn relative từ URL trong DB (VD: http://192.168.../uploads/file.png -> /uploads/file.png)
  let path = dbUrl;
  if (dbUrl.includes('/uploads/')) {
    path = '/uploads/' + dbUrl.split('/uploads/')[1];
  }
  
  // Nối với BASE_URL hiện tại của thiết bị
  const host = getBaseUrl().replace('/api', '');
  return host + path;
};

export default api;
