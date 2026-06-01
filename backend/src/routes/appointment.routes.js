const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { verifyToken, authorize } = require('../utils/auth');
const { validate, createAppointmentSchema, updateAppointmentStatusSchema } = require('../validations');

// [GET] /api/appointments/dashboard — Thống kê cho Dashboard (ĐẶT TRƯỚC /:id)
router.get('/dashboard', verifyToken, authorize('ADMIN', 'DOCTOR'), appointmentController.getDashboardStats);

// [GET] /api/appointments/my — Bệnh nhân xem lịch khám của mình
router.get('/my', verifyToken, appointmentController.getMyAppointments);

// [GET] /api/appointments — Admin/Bác sĩ xem danh sách lịch khám
router.get('/', verifyToken, authorize('ADMIN', 'DOCTOR'), appointmentController.getAll);

// [POST] /api/appointments — Bệnh nhân đặt lịch (hoặc Admin đặt hộ)
router.post('/', verifyToken, validate(createAppointmentSchema), appointmentController.create);

// [PATCH] /api/appointments/:id/status — Admin/Bác sĩ duyệt/từ chối/hoàn thành, Bệnh nhân hủy
router.patch('/:id/status', verifyToken, authorize('ADMIN', 'DOCTOR', 'PATIENT'), validate(updateAppointmentStatusSchema), appointmentController.updateStatus);

module.exports = router;
