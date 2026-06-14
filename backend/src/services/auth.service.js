/**
 * Auth Service — Refactored with Repository Pattern
 * Handles authentication, token management, session tracking
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const envConfig = require('../utils/env');
const userRepo = require('../repositories/user.repository');
const patientRepo = require('../repositories/patient.repository');
const refreshTokenRepo = require('../repositories/refresh-token.repository');
const auditService = require('./audit.service');
const { ApiError } = require('../utils/errorHandler');

const JWT_SECRET = envConfig.JWT_SECRET || process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET chưa được cấu hình trong biến môi trường (.env). Server không thể khởi động!');
}

class AuthService {
  async register(data, req = null) {
    const { email, phone, fullName, password } = data;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError('Email không hợp lệ!', 400);
    }

    // Validate password length
    if (!password || password.length < 6) {
      throw new ApiError('Mật khẩu phải có ít nhất 6 ký tự!', 400);
    }

    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      throw new ApiError('Email đã được sử dụng!', 400);
    }

    // 2. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Tạo User và thông tin Patient mặc định
    const user = await userRepo.create(
      {
        email,
        phone,
        fullName,
        passwordHash,
        role: 'PATIENT',
        patient: {
          create: {}, // Tạo bản ghi rỗng bên bảng Patient map theo userId
        },
      },
      { include: { patient: true } }
    );

    // 4. Sinh Access Token + Refresh Token
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign({ ...payload, type: 'access', jti: Math.random().toString(36).substring(7) }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh', jti: Math.random().toString(36).substring(7) }, JWT_SECRET, { expiresIn: '30d' });

    // 5. Lưu Refresh Token vào DB (hỗ trợ revoke)
    await this._saveRefreshToken(user.id, refreshToken, req);

    // 6. Audit log
    auditService.log({
      userId: user.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      newValue: { email, fullName, role: 'PATIENT' },
      req,
    });

    // Trả về không kèm passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async login(data, req = null) {
    const { email, password } = data;

    // 1. Tìm user bằng email + kèm doctor/patient profile
    const user = await userRepo.findByEmail(email, {
      include: {
        doctor: {
          include: { specialty: { select: { name: true, icon: true } } },
        },
        patient: true,
      },
    });

    if (!user) {
      throw new ApiError('Email hoặc mật khẩu không chính xác!', 400);
    }

    // 2. So khớp password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError('Email hoặc mật khẩu không chính xác!', 400);
    }

    if (!user.isActive) {
      throw new ApiError('Tài khoản của bạn đã bị khóa!', 400);
    }

    // 3. Sinh token
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign({ ...payload, type: 'access', jti: Math.random().toString(36).substring(7) }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh', jti: Math.random().toString(36).substring(7) }, JWT_SECRET, { expiresIn: '30d' });

    // 4. Lưu Refresh Token vào DB
    await this._saveRefreshToken(user.id, refreshToken, req);

    // 5. Audit log
    auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      req,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async changePassword(userId, data, req = null) {
    const { oldPassword, newPassword } = data;

    const user = await userRepo.findById(userId);
    if (!user) throw new ApiError('Không tìm thấy người dùng', 400);

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) throw new ApiError('Mật khẩu cũ không chính xác', 400);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await userRepo.update(userId, { passwordHash });

    // Revoke tất cả refresh tokens khi đổi mật khẩu (bảo mật)
    await refreshTokenRepo.revokeAllByUser(userId);

    // Audit log
    auditService.log({
      userId: parseInt(userId),
      action: 'UPDATE',
      entityType: 'User',
      entityId: parseInt(userId),
      newValue: { field: 'password', changed: true },
      req,
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async getMe(userId) {
    const user = await userRepo.findByIdWithProfile(userId);
    if (!user) throw new ApiError('Người dùng không tồn tại', 404);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async refreshToken(token) {
    if (!token) {
      throw new ApiError('Refresh token không hợp lệ hoặc đã hết hạn!', 400);
    }

    try {
      // 1. Verify JWT signature
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'refresh') {
        throw new ApiError('Loại token không hợp lệ, yêu cầu refresh token', 400);
      }

      // 2. Kiểm tra token có trong DB và chưa bị revoke
      const storedToken = await refreshTokenRepo.findByToken(token);
      if (!storedToken || storedToken.isRevoked) {
        throw new ApiError('Refresh token đã bị thu hồi!', 400);
      }
      if (storedToken.expiresAt < new Date()) {
        throw new ApiError('Refresh token đã hết hạn!', 400);
      }

      // 3. Tìm user trong DB để đảm bảo còn tồn tại và hoạt động
      const user = await userRepo.findById(decoded.id);
      if (!user) throw new ApiError('Không tìm thấy người dùng!', 400);
      if (!user.isActive) throw new ApiError('Tài khoản của bạn đã bị khóa!', 400);

      // 4. Token Rotation: Revoke token cũ, cấp token mới
      await refreshTokenRepo.revokeByToken(token);

      const payload = { id: user.id, email: user.email, role: user.role };
      const accessToken = jwt.sign({ ...payload, type: 'access', jti: Math.random().toString(36).substring(7) }, JWT_SECRET, { expiresIn: '15m' });
      const newRefreshToken = jwt.sign({ ...payload, type: 'refresh', jti: Math.random().toString(36).substring(7) }, JWT_SECRET, { expiresIn: '30d' });

      // Lưu token mới
      await this._saveRefreshToken(user.id, newRefreshToken);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error.message.includes('thu hồi') || error.message.includes('hết hạn') || error.message.includes('khóa')) {
        throw new ApiError(error.message, 400);
      }
      throw new ApiError('Refresh token không hợp lệ hoặc đã hết hạn!', 400);
    }
  }

  /**
   * Logout — Revoke refresh token hiện tại
   */
  async logout(refreshToken, req = null) {
    if (!refreshToken) throw new ApiError('Refresh token là bắt buộc', 400);

    try {
      await refreshTokenRepo.revokeByToken(refreshToken);
    } catch (error) {
      // Token không tồn tại trong DB → vẫn coi là logout thành công
    }

    if (req?.user) {
      auditService.log({
        userId: req.user.id,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: req.user.id,
        req,
      });
    }

    return { message: 'Đăng xuất thành công' };
  }

  /**
   * Force Logout — Revoke TẤT CẢ refresh tokens của user (đăng xuất khỏi mọi thiết bị)
   */
  async forceLogout(userId, req = null) {
    await refreshTokenRepo.revokeAllByUser(userId);

    auditService.log({
      userId: parseInt(userId),
      action: 'LOGOUT',
      entityType: 'User',
      entityId: parseInt(userId),
      newValue: { type: 'force_logout_all_devices' },
      req,
    });

    return { message: 'Đã đăng xuất khỏi tất cả thiết bị' };
  }

  /**
   * Xem danh sách phiên đăng nhập đang hoạt động
   */
  async getActiveSessions(userId) {
    return refreshTokenRepo.findActiveByUser(userId);
  }

  /**
   * Lưu refresh token vào DB
   */
  async _saveRefreshToken(userId, token, req = null) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 ngày

    await refreshTokenRepo.create({
      userId: parseInt(userId),
      token,
      device: req?.get?.('User-Agent') || null,
      ipAddress: req?.ip || null,
      expiresAt,
    });
  }
}

module.exports = new AuthService();
