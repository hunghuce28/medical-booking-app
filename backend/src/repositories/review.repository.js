/**
 * Review Repository
 * Data access layer for Review model
 */

const BaseRepository = require('./base.repository');

class ReviewRepository extends BaseRepository {
  constructor() {
    super('review');
  }

  async findByAppointmentId(appointmentId) {
    return this.findUnique({ appointmentId: parseInt(appointmentId) });
  }

  async findByDoctorId(doctorId, options = {}) {
    return this.findManyWithCount(
      { doctorId: parseInt(doctorId) },
      {
        include: {
          patient: {
            include: { user: { select: { fullName: true, avatar: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        ...options,
      }
    );
  }

  async getAverageRating(doctorId, tx = null) {
    const model = tx ? tx.review : this.model;
    return model.aggregate({
      where: { doctorId: parseInt(doctorId) },
      _avg: { rating: true },
      _count: { id: true },
    });
  }
}

module.exports = new ReviewRepository();
