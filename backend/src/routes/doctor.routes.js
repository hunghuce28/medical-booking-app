const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { verifyToken, authorize } = require('../utils/auth');
const { validate, createDoctorSchema } = require('../validations');
const { cacheResponse, invalidateCache } = require('../middleware/cache.middleware');

// [GET] /api/doctors — Ai cũng xem được danh sách bác sĩ
router.get('/', cacheResponse('doctors', 300), doctorController.getAll);

// [GET] /api/doctors/:id
router.get('/:id', cacheResponse('doctor', 300), doctorController.getById);

// [GET] /api/doctors/:id/schedules — Lịch làm việc cố định
router.get('/:id/schedules', cacheResponse('doctorSchedules', 300), doctorController.getSchedules);

// [GET] /api/doctors/:id/available-slots?date=YYYY-MM-DD — Khung giờ trống theo ngày
router.get('/:id/available-slots', doctorController.getAvailableSlots);

// === Admin Routes ===
// [POST] /api/doctors
router.post('/', verifyToken, authorize('ADMIN'), invalidateCache('doctors:*'), validate(createDoctorSchema), doctorController.create);

// [PUT] /api/doctors/:id
router.put('/:id', verifyToken, authorize('ADMIN'), invalidateCache('doctors:*'), invalidateCache('doctor:*'), doctorController.update);

// [DELETE] /api/doctors/:id
router.delete('/:id', verifyToken, authorize('ADMIN'), invalidateCache('doctors:*'), invalidateCache('doctor:*'), doctorController.delete);

// [PUT] /api/doctors/:id/schedules — Cập nhật lịch làm việc bác sĩ
router.put('/:id/schedules', verifyToken, authorize('ADMIN', 'DOCTOR'), invalidateCache('doctorSchedules:*'), doctorController.updateSchedules);

module.exports = router;
