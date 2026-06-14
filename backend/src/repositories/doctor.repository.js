/**
 * Doctor Repository
 * Data access layer for Doctor model
 */

const BaseRepository = require('./base.repository');

const DOCTOR_LIST_INCLUDE = {
  user: { select: { fullName: true, email: true, phone: true, avatar: true } },
  specialty: { select: { name: true, icon: true } },
};

const DOCTOR_DETAIL_INCLUDE = {
  user: { select: { fullName: true, email: true, phone: true, avatar: true } },
  specialty: true,
  schedules: true,
};

class DoctorRepository extends BaseRepository {
  constructor() {
    super('doctor');
  }

  async findByUserId(userId) {
    return this.findUnique({ userId: parseInt(userId) });
  }

  async findAllWithUser(filter = {}, options = {}) {
    return this.findMany(filter, {
      include: DOCTOR_LIST_INCLUDE,
      orderBy: { rating: 'desc' },
      ...options,
    });
  }

  async findByIdWithDetails(id) {
    return this.findById(id, { include: DOCTOR_DETAIL_INCLUDE });
  }

  async updateRating(doctorId, rating, totalReviews, tx = null) {
    const model = tx ? tx.doctor : this.model;
    return model.update({
      where: { id: parseInt(doctorId) },
      data: { rating, totalReviews },
    });
  }
}

module.exports = new DoctorRepository();
