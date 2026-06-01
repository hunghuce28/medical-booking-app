const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medical-record.controller');
const { verifyToken, authorize } = require('../utils/auth');
const { validate, createMedicalRecordSchema } = require('../validations');

// [POST] /api/medical-records — Bác sĩ/Admin tạo kết quả khám
router.post('/', verifyToken, authorize('ADMIN', 'DOCTOR'), validate(createMedicalRecordSchema), medicalRecordController.create);

// [GET] /api/medical-records/:appointmentId — Xem kết quả theo lịch hẹn
router.get('/:appointmentId', verifyToken, medicalRecordController.getByAppointmentId);

module.exports = router;
