/**
 * Specialty Repository
 * Data access layer for Specialty model
 */

const BaseRepository = require('./base.repository');

class SpecialtyRepository extends BaseRepository {
  constructor() {
    super('specialty');
  }

  async findByName(name) {
    return this.findUnique({ name });
  }

  async findAllWithDoctorCount(filter = {}) {
    return this.findMany(filter, {
      include: {
        _count: { select: { doctors: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = new SpecialtyRepository();
