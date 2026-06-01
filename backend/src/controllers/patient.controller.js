const patientService = require('../services/patient.service');

class PatientController {
  async getAll(req, res, next) {
    try {
      const result = await patientService.getAllPatients(req.query, req.user);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const patient = await patientService.getPatientById(req.params.id, req.user);
      res.status(200).json({ success: true, data: patient });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const result = await patientService.togglePatientStatus(req.params.id);
      const msg = result.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản';
      res.status(200).json({ success: true, message: msg, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await patientService.getProfile(userId);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await patientService.updateProfile(userId, req.body);
      res.status(200).json({ success: true, message: 'Cập nhật hồ sơ thành công', data: profile });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PatientController();
