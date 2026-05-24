const appointmentService = require('../services/appointment.service');

class AppointmentController {
  async getAll(req, res, next) {
    try {
      const result = await appointmentService.getAllAppointments(req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const appointment = await appointmentService.createAppointment(req.body);
      res.status(201).json({ success: true, message: 'Đặt lịch khám thành công', data: appointment });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status, cancelReason } = req.body;
      const appointment = await appointmentService.updateStatus(req.params.id, status, cancelReason);
      res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: appointment });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMyAppointments(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await appointmentService.getPatientAppointments(userId, req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const stats = await appointmentService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppointmentController();
