const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../utils/auth');
const { validate, registerSchema, loginSchema, changePasswordSchema, refreshTokenSchema } = require('../validations');

// [POST] /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// [POST] /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// [GET]  /api/auth/me — Lấy thông tin user hiện tại
router.get('/me', verifyToken, authController.me);

// [PUT] /api/auth/change-password — Đổi mật khẩu (yêu cầu đăng nhập)
router.put('/change-password', verifyToken, validate(changePasswordSchema), authController.changePassword);

// [POST] /api/auth/refresh-token — Làm mới token
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

module.exports = router;
