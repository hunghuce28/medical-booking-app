const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { verifyToken, authorize } = require('../utils/auth');

// [GET] /api/doctors — Ai cũng xem được danh sách bác sĩ
router.get('/', doctorController.getAll);

// [GET] /api/doctors/:id
router.get('/:id', doctorController.getById);

// [GET] /api/doctors/:id/schedules — Lịch làm việc cố định
router.get('/:id/schedules', doctorController.getSchedules);

// [GET] /api/doctors/:id/available-slots?date=YYYY-MM-DD — Khung giờ trống theo ngày
router.get('/:id/available-slots', doctorController.getAvailableSlots);

// === Admin Routes ===
// [POST] /api/doctors
router.post('/', verifyToken, authorize('ADMIN'), doctorController.create);

// [PUT] /api/doctors/:id
router.put('/:id', verifyToken, authorize('ADMIN'), doctorController.update);

// [DELETE] /api/doctors/:id
router.delete('/:id', verifyToken, authorize('ADMIN'), doctorController.delete);

module.exports = router;
