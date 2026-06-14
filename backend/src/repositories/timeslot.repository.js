/**
 * TimeSlot Repository
 * Data access layer for TimeSlot model
 */

const BaseRepository = require('./base.repository');

class TimeSlotRepository extends BaseRepository {
  constructor() {
    super('timeSlot');
  }

  async findByDoctorAndDate(doctorId, date, statusFilter = {}) {
    return this.findMany({
      doctorId: parseInt(doctorId),
      date,
      ...statusFilter,
    });
  }

  async upsertSlot(doctorId, date, startTime, endTime) {
    return this.upsert(
      {
        doctorId_date_startTime: {
          doctorId: parseInt(doctorId),
          date,
          startTime,
        },
      },
      {
        doctorId: parseInt(doctorId),
        date,
        startTime,
        endTime,
        status: 'AVAILABLE',
      },
      {} // no update if exists
    );
  }

  /**
   * Pessimistic lock — SELECT FOR UPDATE trong transaction
   */
  async findByIdForUpdate(id, tx) {
    const result = await tx.$queryRaw`
      SELECT * FROM time_slots 
      WHERE id = ${parseInt(id)} 
      FOR UPDATE
    `;
    return result[0] || null;
  }

  async updateStatus(id, status, tx = null) {
    const model = tx ? tx.timeSlot : this.model;
    return model.update({
      where: { id: parseInt(id) },
      data: { status },
    });
  }
}

module.exports = new TimeSlotRepository();
