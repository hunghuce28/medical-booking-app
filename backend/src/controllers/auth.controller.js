const authService = require('../services/auth.service');
const { asyncHandler, ApiError } = require('../utils/errorHandler');

class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: result
    });
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result
    });
  });

  changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await authService.changePassword(userId, req.body);
    res.status(200).json({ success: true, message: result.message });
  });

  me = asyncHandler(async (req, res) => {
    const result = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, data: result });
  });

  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json({
      success: true,
      message: 'Lấy token mới thành công',
      data: result
    });
  });
}

module.exports = new AuthController();
