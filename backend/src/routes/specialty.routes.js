const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialty.controller');
const { verifyToken, authorize } = require('../utils/auth');
const { validate, createSpecialtySchema, updateSpecialtySchema } = require('../validations');
const { cacheResponse, invalidateCache } = require('../middleware/cache.middleware');

// [GET] /api/specialties — Ai cũng xem được danh sách chuyên khoa
router.get('/', cacheResponse('specialties', 300), specialtyController.getAll);

// [GET] /api/specialties/:id
router.get('/:id', cacheResponse('specialty', 300), specialtyController.getById);

// === Admin Routes (Yêu cầu đăng nhập + quyền ADMIN) ===
// [POST] /api/specialties
router.post('/', verifyToken, authorize('ADMIN'), invalidateCache('specialties:*'), validate(createSpecialtySchema), specialtyController.create);

// [PUT] /api/specialties/:id
router.put('/:id', verifyToken, authorize('ADMIN'), invalidateCache('specialties:*'), invalidateCache('specialty:*'), validate(updateSpecialtySchema), specialtyController.update);

// [DELETE] /api/specialties/:id
router.delete('/:id', verifyToken, authorize('ADMIN'), invalidateCache('specialties:*'), invalidateCache('specialty:*'), specialtyController.delete);

module.exports = router;
