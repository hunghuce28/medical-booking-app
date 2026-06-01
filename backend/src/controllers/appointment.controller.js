const appointmentService = require('../services/appointment.service');
const { asyncHandler } = require('../utils/errorHandler');

class AppointmentController {
  getAll = asyncHandler(async (req, res) => {
    const result = await appointmentService.getAllAppointments(req.query, req.user);
    res.status(200).json({ success: true, data: result });
  });

  create = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.createAppointment(req.body, req.user);
    res.status(201).json({ success: true, message: 'Đặt lịch khám thành công', data: appointment });
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { status, cancelReason } = req.body;
    const appointment = await appointmentService.updateStatus(req.params.id, status, cancelReason, req.user);
    res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: appointment });
  });

  getMyAppointments = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await appointmentService.getPatientAppointments(userId, req.query);
    res.status(200).json({ success: true, data: result });
  });

  getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await appointmentService.getDashboardStats(req.user);
    res.status(200).json({ success: true, data: stats });
  });
}

module.exports = new AppointmentController();
