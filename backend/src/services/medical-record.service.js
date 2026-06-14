/**
 * Medical Record Service — Refactored with Repository Pattern
 * Supports nested prescriptions and attachments
 */

const medicalRecordRepo = require('../repositories/medical-record.repository');
const appointmentRepo = require('../repositories/appointment.repository');
const auditService = require('./audit.service');
const prisma = require('../utils/prisma');

class MedicalRecordService {
  async create(data, currentUser = null, req = null) {
    const { appointmentId, diagnosis, prescription, notes, followUpDate, prescriptions, attachments } = data;

    // Kiểm tra appointment tồn tại
    const appointment = await appointmentRepo.findById(appointmentId, {
      include: { doctor: true },
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
    const existing = await medicalRecordRepo.findByAppointmentId(appointmentId);
    if (existing) throw new Error('Lịch khám này đã có kết quả rồi');

    // Tạo trong transaction (medical record + prescriptions + attachments)
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.medicalRecord.create({
        data: {
          appointmentId: parseInt(appointmentId),
          diagnosis,
          prescription, // Giữ trường cũ cho backward compatibility
          notes,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          // Tạo prescriptions chi tiết nếu có
          ...(prescriptions && prescriptions.length > 0 && {
            prescriptions: {
              create: prescriptions.map((p) => ({
                medicineName: p.medicineName,
                dosage: p.dosage,
                frequency: p.frequency,
                duration: p.duration || null,
                notes: p.notes || null,
              })),
            },
          }),
          // Tạo attachments nếu có
          ...(attachments && attachments.length > 0 && {
            attachments: {
              create: attachments.map((a) => ({
                fileName: a.fileName,
                fileUrl: a.fileUrl,
                fileType: a.fileType || 'image',
                description: a.description || null,
              })),
            },
          }),
        },
        include: {
          prescriptions: true,
          attachments: true,
        },
      });

      return newRecord;
    });

    // Audit log
    auditService.log({
      userId: currentUser?.id,
      action: 'CREATE',
      entityType: 'MedicalRecord',
      entityId: record.id,
      newValue: { appointmentId, diagnosis, prescriptionCount: prescriptions?.length || 0 },
      req,
    });

    return record;
  }

  async getByAppointmentId(appointmentId, currentUser = null) {
    const record = await medicalRecordRepo.findByAppointmentId(appointmentId);
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
