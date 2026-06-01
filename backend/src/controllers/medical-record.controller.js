const medicalRecordService = require('../services/medical-record.service');

class MedicalRecordController {
  async create(req, res, next) {
    try {
      const record = await medicalRecordService.create(req.body, req.user);
      res.status(201).json({ success: true, message: 'Đã lưu kết quả khám', data: record });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getByAppointmentId(req, res, next) {
    try {
      const record = await medicalRecordService.getByAppointmentId(req.params.appointmentId, req.user);
      res.status(200).json({ success: true, data: record });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }
}

module.exports = new MedicalRecordController();
