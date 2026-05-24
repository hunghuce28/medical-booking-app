const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const envConfig = require('../utils/env');

const JWT_SECRET = envConfig.JWT_SECRET || process.env.JWT_SECRET || 'super_secret_key_medical_booking';

class AuthService {
  async register(data) {
    const { email, phone, fullName, password } = data;

    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email đã được sử dụng!');
    }

    // 2. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Tạo User và thông tin Patient mặc định
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        fullName,
        passwordHash,
        role: 'PATIENT',
        patient: {
          create: {} // Tạo bản ghi rỗng bên bảng Patient map theo userId
        }
      },
      include: {
        patient: true
      }
    });

    // 4. Sinh Access Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    // Trả về không kèm passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  async login(data) {
    const { email, password } = data;

    // 1. Tìm user bằng email + kèm doctor/patient profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctor: {
          include: { specialty: { select: { name: true, icon: true } } }
        },
        patient: true,
      }
    });

    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác!');
    }

    // 2. So khớp password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không chính xác!');
    }

    if (!user.isActive) {
      throw new Error('Tài khoản của bạn đã bị khóa!');
    }

    // 3. Sinh token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }
  async changePassword(userId, data) {
    const { oldPassword, newPassword } = data;

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) throw new Error('Không tìm thấy người dùng');

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) throw new Error('Mật khẩu cũ không chính xác');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { passwordHash },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        doctor: {
          include: { specialty: { select: { name: true, icon: true } } }
        },
        patient: true,
      }
    });
    if (!user) throw new Error('Người dùng không tồn tại');
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async refreshToken(token) {
    if (!token) {
      throw new Error('Refresh token không hợp lệ hoặc đã hết hạn!');
    }

    try {
      // 1. Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 2. Tìm user trong DB để đảm bảo còn tồn tại và hoạt động
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new Error('Không tìm thấy người dùng!');
      }

      if (!user.isActive) {
        throw new Error('Tài khoản của bạn đã bị khóa!');
      }

      // 3. Sinh token mới
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

      return {
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw new Error('Refresh token không hợp lệ hoặc đã hết hạn!');
    }
  }
}

module.exports = new AuthService();
