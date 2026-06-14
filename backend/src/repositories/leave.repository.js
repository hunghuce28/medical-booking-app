/**
 * LeaveRequest & Holiday Repository
 */

const BaseRepository = require('./base.repository');

class LeaveRepository extends BaseRepository {
  constructor() {
    super('leaveRequest');
  }

  /**
   * Kiểm tra bác sĩ có lịch nghỉ phép đã phê duyệt (APPROVED) vào một ngày cụ thể hay không
   * @param {number} doctorId
   * @param {Date} date
   */
  async findApprovedLeaveOnDate(doctorId, date) {
    // Chỉ check các ngày nghỉ phép có trạng thái APPROVED
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return this.model.findFirst({
      where: {
        doctorId: parseInt(doctorId),
        status: 'APPROVED',
        startDate: { lte: checkDate },
        endDate: { gte: checkDate },
      },
    });
  }

  /**
   * Kiểm tra một ngày cụ thể có phải ngày lễ quốc gia (Holiday) không
   * @param {Date} date
   */
  async findHolidayOnDate(date) {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return this.prisma.holiday.findUnique({
      where: { date: checkDate },
    });
  }
}

module.exports = new LeaveRepository();
