const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../utils/auth');

// [POST] /api/auth/register
router.post('/register', authController.register);

// [POST] /api/auth/login
router.post('/login', authController.login);

// [GET]  /api/auth/me — Lấy thông tin user hiện tại
router.get('/me', verifyToken, authController.me);

// [PUT] /api/auth/change-password — Đổi mật khẩu (yêu cầu đăng nhập)
router.put('/change-password', verifyToken, authController.changePassword);

// [POST] /api/auth/refresh-token — Làm mới token
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
