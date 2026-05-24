const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialty.controller');
const { verifyToken, authorize } = require('../utils/auth');

// [GET] /api/specialties — Ai cũng xem được danh sách chuyên khoa
router.get('/', specialtyController.getAll);

// [GET] /api/specialties/:id
router.get('/:id', specialtyController.getById);

// === Admin Routes (Yêu cầu đăng nhập + quyền ADMIN) ===
// [POST] /api/specialties
router.post('/', verifyToken, authorize('ADMIN'), specialtyController.create);

// [PUT] /api/specialties/:id
router.put('/:id', verifyToken, authorize('ADMIN'), specialtyController.update);

// [DELETE] /api/specialties/:id
router.delete('/:id', verifyToken, authorize('ADMIN'), specialtyController.delete);

module.exports = router;
