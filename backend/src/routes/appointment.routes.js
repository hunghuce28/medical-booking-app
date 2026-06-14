const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { verifyToken } = require('../utils/auth');
const { requirePermission } = require('../middleware/permission.middleware');
const { auditAction } = require('../middleware/audit.middleware');
const { validate, createAppointmentSchema, updateAppointmentStatusSchema } = require('../validations');

/**
 * @openapi
 * /api/appointments/dashboard:
 *   get:
 *     summary: Thống kê Dashboard (Admin/Bác sĩ)
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/dashboard', verifyToken, requirePermission('appointment.dashboard'), appointmentController.getDashboardStats);

/**
 * @openapi
 * /api/appointments/my:
 *   get:
 *     summary: Bệnh nhân xem lịch khám của mình
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/my', verifyToken, appointmentController.getMyAppointments);

/**
 * @openapi
 * /api/appointments:
 *   get:
 *     summary: Danh sách lịch khám (Admin/Bác sĩ)
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', verifyToken, requirePermission('appointment.view_all'), appointmentController.getAll);

/**
 * @openapi
 * /api/appointments:
 *   post:
 *     summary: Bệnh nhân đặt lịch khám
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/',
  verifyToken,
  requirePermission('appointment.create'),
  validate(createAppointmentSchema),
  auditAction('Appointment', 'CREATE'),
  appointmentController.create
);

/**
 * @openapi
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái lịch khám
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/status',
  verifyToken,
  requirePermission('appointment.manage_status'),
  validate(updateAppointmentStatusSchema),
  appointmentController.updateStatus
);

module.exports = router;
