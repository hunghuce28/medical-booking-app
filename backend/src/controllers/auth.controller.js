const authService = require('../services/auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, phone, fullName, password } = req.body;

      // Basic validation
      if (!email || !fullName || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ thông tin bắt buộc (email, họ tên, mật khẩu)'
        });
      }

      const result = await authService.register({ email, phone, fullName, password });

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: result
      });
    } catch (error) {
      // Đẩy lỗi sang Global Error Handler trong index.js
      next(error); 
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập email và mật khẩu'
        });
      }

      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result
      });
    } catch (error) {
      if (error.message.includes('không chính xác') || error.message.includes('bị khóa')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      const result = await authService.changePassword(userId, { oldPassword, newPassword });
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async me(req, res, next) {
    try {
      const result = await authService.getMe(req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp refresh token'
        });
      }

      const result = await authService.refreshToken(refreshToken);
      res.status(200).json({
        success: true,
        message: 'Lấy token mới thành công',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
