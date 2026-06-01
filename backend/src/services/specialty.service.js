const prisma = require('../utils/prisma');

class SpecialtyService {
  async getAllSpecialties(query = {}) {
    const { includeInactive } = query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };

    return await prisma.specialty.findMany({
      where: filter,
      include: {
        _count: {
          select: { doctors: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSpecialtyById(id) {
    const specialty = await prisma.specialty.findUnique({
      where: { id: parseInt(id) }
    });
    if (!specialty) throw new Error('Không tìm thấy chuyên khoa');
    return specialty;
  }

  async createSpecialty(data) {
    const { name, description, icon } = data;
    const existing = await prisma.specialty.findUnique({ where: { name } });
    if (existing) throw new Error('Chuyên khoa đã tồn tại');

    return await prisma.specialty.create({
      data: { name, description, icon }
    });
  }

  async updateSpecialty(id, data) {
    // Whitelist các trường được phép cập nhật
    const { name, description, icon, isActive } = data;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = isActive;

    return await prisma.specialty.update({
      where: { id: parseInt(id) },
      data: updateData
    });
  }

  async deleteSpecialty(id) {
    return await prisma.specialty.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
  }
}

module.exports = new SpecialtyService();
