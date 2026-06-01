const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { verifyToken, authorize } = require('../utils/auth');
const { validate, updatePatientProfileSchema } = require('../validations');

// [GET] /api/patients — Admin xem danh sách bệnh nhân
router.get('/', verifyToken, authorize('ADMIN', 'DOCTOR'), patientController.getAll);

// [GET] /api/patients/profile — Lấy hồ sơ cá nhân (Dành cho Mobile App)
router.get('/profile', verifyToken, authorize('PATIENT'), patientController.getProfile);

// [PUT] /api/patients/profile — Cập nhật hồ sơ cá nhân
router.put('/profile', verifyToken, authorize('PATIENT'), validate(updatePatientProfileSchema), patientController.updateProfile);

// [GET] /api/patients/:id — Admin xem chi tiết bệnh nhân
router.get('/:id', verifyToken, authorize('ADMIN', 'DOCTOR'), patientController.getById);

// [PATCH] /api/patients/:id/toggle-status — Khóa/Mở khóa tài khoản bệnh nhân
router.patch('/:id/toggle-status', verifyToken, authorize('ADMIN'), patientController.toggleStatus);

module.exports = router;
