const specialtyService = require('../services/specialty.service');
const { asyncHandler } = require('../utils/errorHandler');

class SpecialtyController {
  getAll = asyncHandler(async (req, res) => {
    const specialties = await specialtyService.getAllSpecialties(req.query);
    res.status(200).json({ success: true, data: specialties });
  });

  getById = asyncHandler(async (req, res) => {
    const specialty = await specialtyService.getSpecialtyById(req.params.id);
    res.status(200).json({ success: true, data: specialty });
  });

  create = asyncHandler(async (req, res) => {
    const specialty = await specialtyService.createSpecialty(req.body);
    res.status(201).json({ success: true, message: 'Tạo chuyên khoa thành công', data: specialty });
  });

  update = asyncHandler(async (req, res) => {
    const specialty = await specialtyService.updateSpecialty(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật thành công', data: specialty });
  });

  delete = asyncHandler(async (req, res) => {
    await specialtyService.deleteSpecialty(req.params.id);
    res.status(200).json({ success: true, message: 'Đã ẩn chuyên khoa này' });
  });
}

module.exports = new SpecialtyController();
