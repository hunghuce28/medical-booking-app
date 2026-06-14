/**
 * AppointmentHistory Repository
 */

const BaseRepository = require('./base.repository');

class HistoryRepository extends BaseRepository {
  constructor() {
    super('appointmentHistory');
  }

  /**
   * Lấy lịch sử thay đổi trạng thái của cuộc hẹn
   * @param {number} appointmentId
   */
  async findByAppointmentId(appointmentId) {
    return this.findMany(
      { appointmentId: parseInt(appointmentId) },
      {
        include: {
          changedByUser: {
            select: { id: true, fullName: true, role: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }
    );
  }
}

module.exports = new HistoryRepository();
