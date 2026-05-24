const specialtyService = require('../services/specialty.service');

class SpecialtyController {
  async getAll(req, res, next) {
    try {
      const specialties = await specialtyService.getAllSpecialties();
      res.status(200).json({ success: true, data: specialties });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const specialty = await specialtyService.getSpecialtyById(req.params.id);
      res.status(200).json({ success: true, data: specialty });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const specialty = await specialtyService.createSpecialty(req.body);
      res.status(201).json({ success: true, message: 'Tạo chuyên khoa thành công', data: specialty });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res, next) {
    try {
      const specialty = await specialtyService.updateSpecialty(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Cập nhật thành công', data: specialty });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await specialtyService.deleteSpecialty(req.params.id);
      res.status(200).json({ success: true, message: 'Đã ẩn chuyên khoa này' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SpecialtyController();
