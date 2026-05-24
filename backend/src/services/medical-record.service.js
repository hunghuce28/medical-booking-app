const prisma = require('../utils/prisma');

class MedicalRecordService {
  async create(data) {
    const { appointmentId, diagnosis, prescription, notes, followUpDate } = data;

    // Kiểm tra appointment tồn tại và đã COMPLETED
    const appointment = await prisma.appointment.findUnique({ where: { id: parseInt(appointmentId) } });
    if (!appointment) throw new Error('Không tìm thấy lịch khám');

    // Kiểm tra đã có kết quả chưa
    const existing = await prisma.medicalRecord.findUnique({ where: { appointmentId: parseInt(appointmentId) } });
    if (existing) throw new Error('Lịch khám này đã có kết quả rồi');

    return await prisma.medicalRecord.create({
      data: {
        appointmentId: parseInt(appointmentId),
        diagnosis,
        prescription,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      }
    });
  }

  async getByAppointmentId(appointmentId) {
    const record = await prisma.medicalRecord.findUnique({
      where: { appointmentId: parseInt(appointmentId) },
      include: {
        appointment: {
          include: {
            patient: { include: { user: { select: { fullName: true } } } },
            doctor: { include: { user: { select: { fullName: true } }, specialty: { select: { name: true } } } },
          }
        }
      }
    });
    if (!record) throw new Error('Chưa có kết quả khám cho lịch hẹn này');
    return record;
  }
}

module.exports = new MedicalRecordService();
