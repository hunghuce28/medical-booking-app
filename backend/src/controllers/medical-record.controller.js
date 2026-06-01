const medicalRecordService = require('../services/medical-record.service');
const { asyncHandler } = require('../utils/errorHandler');

class MedicalRecordController {
  create = asyncHandler(async (req, res) => {
    const record = await medicalRecordService.create(req.body, req.user);
    res.status(201).json({ success: true, message: 'Đã lưu kết quả khám', data: record });
  });

  getByAppointmentId = asyncHandler(async (req, res) => {
    const record = await medicalRecordService.getByAppointmentId(req.params.appointmentId, req.user);
    res.status(200).json({ success: true, data: record });
  });
}

module.exports = new MedicalRecordController();
