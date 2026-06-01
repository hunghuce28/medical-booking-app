/**
 * Auth Store - Zustand
 * Quản lý trạng thái đăng nhập, user info, token
 */

import { create } from 'zustand';
import storage from '../services/storage';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Actions

  /**
   * Đăng nhập
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // api interceptor đã unwrap response.data, nên response = { user, accessToken, refreshToken }
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;

      // Lưu token vào storage (hỗ trợ cả Web & Native)
      await storage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await storage.setItem('refreshToken', refreshToken);
      }

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Đăng nhập thất bại',
      });
      return { success: false, message: error.message };
    }
  },

  /**
   * Đăng ký
   */
  register: async (fullName, email, phone, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', {
        fullName,
        email,
        phone,
        password,
      });
      const { user, accessToken, refreshToken } = response.data;

      await storage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await storage.setItem('refreshToken', refreshToken);
      }

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Đăng ký thất bại',
      });
      return { success: false, message: error.message };
    }
  },

  /**
   * Đăng xuất
   */
  logout: async () => {
    await storage.deleteItem('accessToken');
    await storage.deleteItem('refreshToken');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  /**
   * Khôi phục session từ SecureStore khi mở app
   */
  restoreSession: async () => {
    try {
      const token = await storage.getItem('accessToken');
      if (!token) return;

      // Set token trước để api interceptor có thể dùng (nhưng CHƯA set isAuthenticated)
      set({ token });

      // Fetch đầy đủ user info từ server để xác thực token còn hợp lệ
      const response = await api.get('/auth/me');
      const user = response.data;

      // CHỈ set isAuthenticated: true SAU KHI /auth/me thành công
      set({ user, isAuthenticated: true });
    } catch (error) {
      // Token hết hạn hoặc không hợp lệ → xóa và logout
      console.log('Session restore failed:', error);
      await storage.deleteItem('accessToken');
      await storage.deleteItem('refreshToken');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  /**
   * Cập nhật thông tin user trong store (dùng sau khi sửa profile)
   */
  setUser: (userData) => set({ user: userData }),

  /**
   * Xóa lỗi
   */
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
