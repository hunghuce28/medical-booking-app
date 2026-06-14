/**
 * Specialty Service — Refactored with Repository Pattern
 */

const specialtyRepo = require('../repositories/specialty.repository');
const auditService = require('./audit.service');

class SpecialtyService {
  async getAllSpecialties(query = {}) {
    const { includeInactive } = query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    return specialtyRepo.findAllWithDoctorCount(filter);
  }

  async getSpecialtyById(id) {
    const specialty = await specialtyRepo.findById(id);
    if (!specialty) throw new Error('Không tìm thấy chuyên khoa');
    return specialty;
  }

  async createSpecialty(data, req = null) {
    const { name, description, icon } = data;
    const existing = await specialtyRepo.findByName(name);
    if (existing) throw new Error('Chuyên khoa đã tồn tại');

    const specialty = await specialtyRepo.create({ name, description, icon });

    auditService.log({
      userId: req?.user?.id,
      action: 'CREATE',
      entityType: 'Specialty',
      entityId: specialty.id,
      newValue: { name, description, icon },
      req,
    });

    return specialty;
  }

  async updateSpecialty(id, data, req = null) {
    const { name, description, icon, isActive } = data;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = isActive;

    const old = await specialtyRepo.findById(id);

    const specialty = await specialtyRepo.update(id, updateData);

    auditService.log({
      userId: req?.user?.id,
      action: 'UPDATE',
      entityType: 'Specialty',
      entityId: parseInt(id),
      oldValue: old,
      newValue: updateData,
      req,
    });

    return specialty;
  }

  async deleteSpecialty(id, req = null) {
    const specialty = await specialtyRepo.update(id, { isActive: false });

    auditService.log({
      userId: req?.user?.id,
      action: 'DELETE',
      entityType: 'Specialty',
      entityId: parseInt(id),
      oldValue: { isActive: true },
      newValue: { isActive: false },
      req,
    });

    return specialty;
  }
}

module.exports = new SpecialtyService();
