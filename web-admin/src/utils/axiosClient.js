import axios from 'axios';
import useAuthStore from '../stores/authStore';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm token vào header mỗi request nếu có
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

// Xử lý response/error chung
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Tự động logout nếu token hết hạn (401)
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
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
