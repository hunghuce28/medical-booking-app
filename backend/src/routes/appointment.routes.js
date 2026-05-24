const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { verifyToken, authorize } = require('../utils/auth');

// [GET] /api/appointments/dashboard — Thống kê cho Dashboard (ĐẶT TRƯỚC /:id)
router.get('/dashboard', verifyToken, authorize('ADMIN'), appointmentController.getDashboardStats);

// [GET] /api/appointments/my — Bệnh nhân xem lịch khám của mình
router.get('/my', verifyToken, appointmentController.getMyAppointments);

// [GET] /api/appointments — Admin/Bác sĩ xem danh sách lịch khám
router.get('/', verifyToken, authorize('ADMIN', 'DOCTOR'), appointmentController.getAll);

// [POST] /api/appointments — Bệnh nhân đặt lịch (hoặc Admin đặt hộ)
router.post('/', verifyToken, appointmentController.create);

// [PATCH] /api/appointments/:id/status — Admin/Bác sĩ duyệt/từ chối/hoàn thành
router.patch('/:id/status', verifyToken, authorize('ADMIN', 'DOCTOR'), appointmentController.updateStatus);

module.exports = router;
