const doctorService = require('../services/doctor.service');

class DoctorController {
  async getAll(req, res, next) {
    try {
      const doctors = await doctorService.getAllDoctors(req.query);
      res.status(200).json({ success: true, data: doctors });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const doctor = await doctorService.getDoctorById(req.params.id);
      res.status(200).json({ success: true, data: doctor });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async create(req, res, next) {
    try {
      const doctor = await doctorService.createDoctor(req.body);
      res.status(201).json({ success: true, message: 'Tạo bác sĩ thành công', data: doctor });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res, next) {
    try {
      const doctor = await doctorService.updateDoctor(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Cập nhật thành công', data: doctor });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res, next) {
    try {
      await doctorService.deleteDoctor(req.params.id);
      res.status(200).json({ success: true, message: 'Đã khóa tài khoản bác sĩ' });
    } catch (error) {
      next(error);
    }
  }

  async getSchedules(req, res, next) {
    try {
      const schedules = await doctorService.getSchedules(req.params.id);
      res.status(200).json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSlots(req, res, next) {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tham số date (YYYY-MM-DD)' });
      const slots = await doctorService.getAvailableSlots(req.params.id, date);
      res.status(200).json({ success: true, data: slots });
    } catch (error) {
      next(error);
    }
  }

  async updateSchedules(req, res, next) {
    try {
      const { schedules } = req.body;
      if (!Array.isArray(schedules)) {
        return res.status(400).json({ success: false, message: 'Danh sách schedules phải là một mảng' });
      }
      const result = await doctorService.updateSchedules(req.params.id, schedules);
      res.status(200).json({ success: true, message: 'Cập nhật lịch làm việc thành công', data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new DoctorController();
