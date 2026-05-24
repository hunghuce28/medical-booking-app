const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../utils/auth');

// [GET] /api/notifications — Danh sách thông báo của user
router.get('/', verifyToken, notificationController.getAll);

// [PUT] /api/notifications/read-all — Đọc tất cả (ĐẶT TRƯỚC /:id)
router.put('/read-all', verifyToken, notificationController.markAllAsRead);

// [PUT] /api/notifications/:id/read — Đánh dấu 1 thông báo đã đọc
router.put('/:id/read', verifyToken, notificationController.markAsRead);

module.exports = router;
