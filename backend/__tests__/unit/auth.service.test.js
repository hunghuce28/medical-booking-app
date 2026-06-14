/**
 * Auth Service — Unit Tests
 * Kiểm thử logic xác thực: đăng ký, đăng nhập, đổi mật khẩu, refresh token, logout
 */

// Mock dependencies trước khi import service
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/refresh-token.repository');
jest.mock('../../src/services/audit.service');
jest.mock('../../src/services/notification.service', () => ({
  sendEmailNotification: jest.fn().mockResolvedValue({ messageId: 'test-mail-id' }),
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userRepo = require('../../src/repositories/user.repository');
const refreshTokenRepo = require('../../src/repositories/refresh-token.repository');
const auditService = require('../../src/services/audit.service');

// Set env trước khi import service
process.env.JWT_SECRET = 'test-secret-key';
const authService = require('../../src/services/auth.service');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auditService.log.mockResolvedValue(undefined);
    refreshTokenRepo.create.mockResolvedValue({ id: 1 });
  });

  // ========================
  // REGISTER
  // ========================
  describe('register', () => {
    it('should register successfully with valid data', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        fullName: 'Nguyen Van A',
        role: 'PATIENT',
        passwordHash: 'hashed',
        patient: { id: 1 },
      });

      const result = await authService.register({
        email: 'test@test.com',
        fullName: 'Nguyen Van A',
        password: '123456',
        phone: '0912345678',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.email).toBe('test@test.com');
    });

    it('should throw error for duplicate email', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 1, email: 'test@test.com' });

      await expect(
        authService.register({
          email: 'test@test.com',
          fullName: 'Test',
          password: '123456',
        })
      ).rejects.toThrow('Email đã được sử dụng!');
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        authService.register({
          email: 'invalid-email',
          fullName: 'Test',
          password: '123456',
        })
      ).rejects.toThrow('Email không hợp lệ!');
    });

    it('should throw error for weak password', async () => {
      await expect(
        authService.register({
          email: 'test@test.com',
          fullName: 'Test',
          password: '123',
        })
      ).rejects.toThrow('Mật khẩu phải có ít nhất 6 ký tự!');
    });
  });

  // ========================
  // LOGIN
  // ========================
  describe('login', () => {
    const mockUser = {
      id: 1,
      email: 'test@test.com',
      fullName: 'Test User',
      role: 'PATIENT',
      isActive: true,
      passwordHash: bcrypt.hashSync('123456', 10),
      doctor: null,
      patient: { id: 1 },
    };

    it('should login successfully with correct credentials', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'test@test.com',
        password: '123456',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@test.com');
    });

    it('should throw error for wrong password', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.login({ email: 'test@test.com', password: 'wrong' })
      ).rejects.toThrow('Email hoặc mật khẩu không chính xác!');
    });

    it('should throw error for non-existent email', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'noexist@test.com', password: '123456' })
      ).rejects.toThrow('Email hoặc mật khẩu không chính xác!');
    });

    it('should throw error for locked account', async () => {
      userRepo.findByEmail.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        authService.login({ email: 'test@test.com', password: '123456' })
      ).rejects.toThrow('Tài khoản của bạn đã bị khóa!');
    });
  });

  // ========================
  // CHANGE PASSWORD
  // ========================
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const hashedOld = bcrypt.hashSync('oldpass', 10);
      userRepo.findById.mockResolvedValue({ id: 1, passwordHash: hashedOld });
      userRepo.update.mockResolvedValue({ id: 1 });
      refreshTokenRepo.revokeAllByUser.mockResolvedValue({ count: 2 });

      const result = await authService.changePassword(1, {
        oldPassword: 'oldpass',
        newPassword: 'newpass',
      });

      expect(result.message).toBe('Đổi mật khẩu thành công');
      expect(refreshTokenRepo.revokeAllByUser).toHaveBeenCalledWith(1);
    });

    it('should throw error for wrong old password', async () => {
      const hashedOld = bcrypt.hashSync('oldpass', 10);
      userRepo.findById.mockResolvedValue({ id: 1, passwordHash: hashedOld });

      await expect(
        authService.changePassword(1, {
          oldPassword: 'wrongold',
          newPassword: 'newpass',
        })
      ).rejects.toThrow('Mật khẩu cũ không chính xác');
    });
  });

  // ========================
  // LOGOUT
  // ========================
  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      refreshTokenRepo.revokeByToken.mockResolvedValue({ id: 1 });

      const result = await authService.logout('some-token');
      expect(result.message).toBe('Đăng xuất thành công');
      expect(refreshTokenRepo.revokeByToken).toHaveBeenCalledWith('some-token');
    });
  });

  // ========================
  // FORCE LOGOUT
  // ========================
  describe('forceLogout', () => {
    it('should revoke all tokens for user', async () => {
      refreshTokenRepo.revokeAllByUser.mockResolvedValue({ count: 3 });

      const result = await authService.forceLogout(1);
      expect(result.message).toBe('Đã đăng xuất khỏi tất cả thiết bị');
      expect(refreshTokenRepo.revokeAllByUser).toHaveBeenCalledWith(1);
    });
  });

  // ========================
  // REFRESH TOKEN
  // ========================
  describe('refreshToken', () => {
    it('should throw error for empty token', async () => {
      await expect(authService.refreshToken(null)).rejects.toThrow(
        'Refresh token không hợp lệ hoặc đã hết hạn!'
      );
    });

    it('should throw error for revoked token', async () => {
      const token = jwt.sign(
        { id: 1, email: 'test@test.com', role: 'PATIENT', type: 'refresh' },
        'test-secret-key',
        { expiresIn: '30d' }
      );

      refreshTokenRepo.findByToken.mockResolvedValue({
        token,
        isRevoked: true,
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(authService.refreshToken(token)).rejects.toThrow(
        'Refresh token đã bị thu hồi!'
      );
    });
  });

  // ========================
  // FORGOT PASSWORD
  // ========================
  describe('forgotPassword', () => {
    it('should generate reset token and call sendEmailNotification', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        fullName: 'Test User',
      };
      userRepo.findByEmail.mockResolvedValue(mockUser);
      userRepo.update.mockResolvedValue(mockUser);

      const notificationService = require('../../src/services/notification.service');

      const result = await authService.forgotPassword('user@test.com');
      
      expect(result.message).toBe('Link khôi phục mật khẩu đã được gửi đến email của bạn');
      expect(userRepo.update).toHaveBeenCalled();
      expect(notificationService.sendEmailNotification).toHaveBeenCalled();
    });

    it('should throw error if email does not exist', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.forgotPassword('nonexistent@test.com')
      ).rejects.toThrow('Email không tồn tại trong hệ thống!');
    });
  });

  // ========================
  // RESET PASSWORD
  // ========================
  describe('resetPassword', () => {
    it('should reset password with valid token and revoke old sessions', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 60000),
      };

      userRepo.findOne.mockResolvedValue(mockUser);
      userRepo.update.mockResolvedValue({ id: 1 });
      refreshTokenRepo.revokeAllByUser.mockResolvedValue({ count: 1 });

      const result = await authService.resetPassword('valid-token', 'new-secure-password');

      expect(result.message).toBe('Mật khẩu đã được khôi phục thành công. Vui lòng đăng nhập lại!');
      expect(userRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({
        passwordHash: expect.any(String),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      }));
      expect(refreshTokenRepo.revokeAllByUser).toHaveBeenCalledWith(1);
    });

    it('should throw error for expired or invalid token', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        authService.resetPassword('invalid-token', 'new-secure-password')
      ).rejects.toThrow('Token khôi phục mật khẩu không hợp lệ hoặc đã hết hạn!');
    });
  });
});
