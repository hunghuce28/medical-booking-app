const patientService = require('../services/patient.service');
const { asyncHandler } = require('../utils/errorHandler');

class PatientController {
  getAll = asyncHandler(async (req, res) => {
    const result = await patientService.getAllPatients(req.query, req.user);
    res.status(200).json({ success: true, data: result });
  });

  getById = asyncHandler(async (req, res) => {
    const patient = await patientService.getPatientById(req.params.id, req.user);
    res.status(200).json({ success: true, data: patient });
  });

  toggleStatus = asyncHandler(async (req, res) => {
    const result = await patientService.togglePatientStatus(req.params.id);
    const msg = result.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản';
    res.status(200).json({ success: true, message: msg, data: result });
  });

  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const profile = await patientService.getProfile(userId);
    res.status(200).json({ success: true, data: profile });
  });

  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const profile = await patientService.updateProfile(userId, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật hồ sơ thành công', data: profile });
  });
}

module.exports = new PatientController();
