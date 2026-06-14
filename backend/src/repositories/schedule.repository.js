/**
 * DoctorSchedule Repository
 * Data access layer for DoctorSchedule model
 */

const BaseRepository = require('./base.repository');

class ScheduleRepository extends BaseRepository {
  constructor() {
    super('doctorSchedule');
  }

  async findByDoctorId(doctorId) {
    return this.findMany(
      { doctorId: parseInt(doctorId), isActive: true },
      { orderBy: { dayOfWeek: 'asc' } }
    );
  }

  async findByDoctorAndDay(doctorId, dayOfWeek) {
    return this.findOne({
      doctorId: parseInt(doctorId),
      dayOfWeek,
      isActive: true,
    });
  }

  async upsertSchedule(doctorId, scheduleData, tx = null) {
    const model = tx ? tx.doctorSchedule : this.model;
    const { dayOfWeek, startTime, endTime, slotDurationMinutes = 30, isActive = true } = scheduleData;

    return model.upsert({
      where: {
        doctorId_dayOfWeek: {
          doctorId: parseInt(doctorId),
          dayOfWeek,
        },
      },
      update: {
        startTime,
        endTime,
        slotDurationMinutes: parseInt(slotDurationMinutes),
        isActive,
      },
      create: {
        doctorId: parseInt(doctorId),
        dayOfWeek,
        startTime,
        endTime,
        slotDurationMinutes: parseInt(slotDurationMinutes),
        isActive,
      },
    });
  }

  async deactivateExcept(doctorId, activeDays, tx = null) {
    const model = tx ? tx.doctorSchedule : this.model;
    return model.updateMany({
      where: {
        doctorId: parseInt(doctorId),
        dayOfWeek: { notIn: activeDays },
      },
      data: { isActive: false },
    });
  }
}

module.exports = new ScheduleRepository();
