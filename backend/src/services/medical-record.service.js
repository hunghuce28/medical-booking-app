const prisma = require('../utils/prisma');

class MedicalRecordService {
  async create(data, currentUser = null) {
    const { appointmentId, diagnosis, prescription, notes, followUpDate } = data;

    // Kiểm tra appointment tồn tại
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: { doctor: true }
    });
    if (!appointment) throw new Error('Không tìm thấy lịch khám');

    // Kiểm tra trạng thái phải là COMPLETED hoặc CONFIRMED
    if (appointment.status !== 'COMPLETED' && appointment.status !== 'CONFIRMED') {
      throw new Error('Chỉ có thể tạo kết quả khám cho lịch hẹn đã được duyệt (CONFIRMED) hoặc hoàn thành (COMPLETED)');
    }

    // Kiểm tra bác sĩ chỉ tạo bệnh án cho lịch của mình
    if (currentUser && currentUser.role === 'DOCTOR') {
      if (appointment.doctor.userId !== currentUser.id) {
        throw new Error('Bạn chỉ có thể tạo kết quả khám cho lịch hẹn của mình');
      }
    }

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

  async getByAppointmentId(appointmentId, currentUser = null) {
    const record = await prisma.medicalRecord.findUnique({
      where: { appointmentId: parseInt(appointmentId) },
      include: {
        appointment: {
          include: {
            patient: { include: { user: { select: { id: true, fullName: true } } } },
            doctor: { include: { user: { select: { id: true, fullName: true } }, specialty: { select: { name: true } } } },
          }
        }
      }
    });
    if (!record) throw new Error('Chưa có kết quả khám cho lịch hẹn này');

    // Kiểm tra quyền đọc: chỉ bệnh nhân/bác sĩ liên quan hoặc admin
    if (currentUser && currentUser.role !== 'ADMIN') {
      const isPatient = record.appointment.patient.user.id === currentUser.id;
      const isDoctor = record.appointment.doctor.user.id === currentUser.id;
      if (!isPatient && !isDoctor) {
        throw new Error('Bạn không có quyền xem kết quả khám này');
      }
    }

    return record;
  }
}

module.exports = new MedicalRecordService();
