const doctorService = require('../services/doctor.service');
const { asyncHandler } = require('../utils/errorHandler');

class DoctorController {
  getAll = asyncHandler(async (req, res) => {
    const doctors = await doctorService.getAllDoctors(req.query);
    res.status(200).json({ success: true, data: doctors });
  });

  getById = asyncHandler(async (req, res) => {
    const doctor = await doctorService.getDoctorById(req.params.id);
    res.status(200).json({ success: true, data: doctor });
  });

  create = asyncHandler(async (req, res) => {
    const doctor = await doctorService.createDoctor(req.body);
    res.status(201).json({ success: true, message: 'Tạo bác sĩ thành công', data: doctor });
  });

  update = asyncHandler(async (req, res) => {
    const doctor = await doctorService.updateDoctor(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật thành công', data: doctor });
  });

  delete = asyncHandler(async (req, res) => {
    await doctorService.deleteDoctor(req.params.id);
    res.status(200).json({ success: true, message: 'Đã khóa tài khoản bác sĩ' });
  });

  getSchedules = asyncHandler(async (req, res) => {
    const schedules = await doctorService.getSchedules(req.params.id);
    res.status(200).json({ success: true, data: schedules });
  });

  getAvailableSlots = asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tham số date (YYYY-MM-DD)' });
    }
    const slots = await doctorService.getAvailableSlots(req.params.id, date);
    res.status(200).json({ success: true, data: slots });
  });

  updateSchedules = asyncHandler(async (req, res) => {
    const { schedules } = req.body;
    if (!Array.isArray(schedules)) {
      return res.status(400).json({ success: false, message: 'Danh sách schedules phải là một mảng' });
    }
    const result = await doctorService.updateSchedules(req.params.id, schedules);
    res.status(200).json({ success: true, message: 'Cập nhật lịch làm việc thành công', data: result });
  });
}

module.exports = new DoctorController();
