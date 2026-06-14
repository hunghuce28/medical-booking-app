const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../utils/auth');
const { validate, registerSchema, loginSchema, changePasswordSchema, refreshTokenSchema } = require('../validations');

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản bệnh nhân mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, fullName, password]
 *             properties:
 *               email: { type: string, format: email }
 *               fullName: { type: string, minLength: 2 }
 *               password: { type: string, minLength: 6 }
 *               phone: { type: string, pattern: '^[0-9]{10,11}$' }
 *     responses:
 *       201: { description: Đăng ký thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Đăng nhập thành công }
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Thông tin user }
 */
router.get('/me', verifyToken, authController.me);

/**
 * @openapi
 * /api/auth/change-password:
 *   put:
 *     summary: Đổi mật khẩu (yêu cầu đăng nhập)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.put('/change-password', verifyToken, validate(changePasswordSchema), authController.changePassword);

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     summary: Làm mới access token bằng refresh token
 *     tags: [Auth]
 */
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất — thu hồi refresh token hiện tại
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @openapi
 * /api/auth/force-logout:
 *   post:
 *     summary: Đăng xuất khỏi tất cả thiết bị
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/force-logout', verifyToken, authController.forceLogout);

/**
 * @openapi
 * /api/auth/sessions:
 *   get:
 *     summary: Xem danh sách phiên đăng nhập đang hoạt động
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/sessions', verifyToken, authController.getActiveSessions);

module.exports = router;
