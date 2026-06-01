import axios from 'axios';
import useAuthStore from '../stores/authStore';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cờ chống gọi refresh liên tục khi nhiều request cùng bị 401
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

// Request Interceptor — Tự động gắn token vào header mỗi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor — Xử lý lỗi chung và tự động refresh token
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Bỏ qua interceptor cho các API auth (login/register/refresh-token)
    if (
      originalRequest.url.includes('/auth/login') || 
      originalRequest.url.includes('/auth/register') ||
      originalRequest.url.includes('/auth/refresh-token')
    ) {
      return Promise.reject(error);
    }

    // Server trả về 401 (Unauthorized) và chưa từng thử lại
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh dở, cho các request khác vào hàng đợi
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Gọi API refresh token (dùng axios gốc, không qua interceptor)
        const res = await axios.post('http://localhost:5000/api/auth/refresh-token', { refreshToken });
        const newAccessToken = res.data.data?.accessToken || res.data.accessToken;
        const newRefreshToken = res.data.data?.refreshToken || res.data.refreshToken;

        // Cập nhật token trong store
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        processQueue(null, newAccessToken);

        // Gắn token mới vào request ban đầu và gọi lại
        originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Nếu refresh thất bại, đăng xuất
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getFullImageUrl = (dbUrl) => {
  if (!dbUrl) return null;
  let path = dbUrl;
  if (dbUrl.includes('/uploads/')) {
    path = '/uploads/' + dbUrl.split('/uploads/')[1];
  }
  
  // Lấy host từ baseURL
  const host = 'http://localhost:5000';
  return host + path;
};

export default axiosClient;
