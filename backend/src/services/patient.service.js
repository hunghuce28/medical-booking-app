/**
 * Patient Service — Refactored with Repository Pattern
 */

const patientRepo = require('../repositories/patient.repository');
const doctorRepo = require('../repositories/doctor.repository');
const userRepo = require('../repositories/user.repository');
const appointmentRepo = require('../repositories/appointment.repository');
const auditService = require('./audit.service');
const prisma = require('../utils/prisma');

class PatientService {
  async getAllPatients(query, currentUser = null) {
    const { search, page = 1, limit = 20 } = query;
    let filter = {};

    if (currentUser && currentUser.role === 'DOCTOR') {
      const doctor = await doctorRepo.findByUserId(currentUser.id);
      if (doctor) {
        filter.appointments = { some: { doctorId: doctor.id } };
      }
    }

    if (search) {
      filter.user = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    return patientRepo.findAllWithUser(filter, { page, limit });
  }

  async getPatientById(id, currentUser = null) {
    const patientId = parseInt(id);

    if (currentUser && currentUser.role === 'DOCTOR') {
      const doctor = await doctorRepo.findByUserId(currentUser.id);
      if (doctor) {
        const hasAppointment = await appointmentRepo.count({
          patientId: patientId,
          doctorId: doctor.id,
        });
        if (hasAppointment === 0) {
          throw new Error('Bạn không có quyền xem thông tin bệnh nhân này');
        }
      }
    }

    const patient = await patientRepo.findByIdWithDetails(patientId);
    if (!patient) throw new Error('Không tìm thấy bệnh nhân');
    return patient;
  }

  async togglePatientStatus(id, req = null) {
    const patient = await patientRepo.findById(id, { include: { user: true } });
    if (!patient) throw new Error('Không tìm thấy bệnh nhân');

    const oldStatus = patient.user.isActive;
    const updatedUser = await userRepo.update(patient.userId, {
      isActive: !patient.user.isActive,
    });

    auditService.log({
      userId: req?.user?.id,
      action: 'UPDATE',
      entityType: 'Patient',
      entityId: parseInt(id),
      oldValue: { isActive: oldStatus },
      newValue: { isActive: updatedUser.isActive },
      req,
    });

    return updatedUser;
  }

  async getProfile(userId) {
    const patient = await patientRepo.findByUserIdWithProfile(userId);
    if (!patient) throw new Error('Không tìm thấy hồ sơ bệnh nhân');
    return patient;
  }

  async updateProfile(userId, data, req = null) {
    const {
      fullName,
      phone,
      dateOfBirth,
      gender,
      address,
      insuranceNumber,
      bloodType,
      allergies,
      medicalHistory,
    } = data;

    const patient = await patientRepo.findByUserId(userId);
    if (!patient) throw new Error('Không tìm thấy hồ sơ bệnh nhân');

    const result = await prisma.$transaction(async (tx) => {
      if (fullName !== undefined || phone !== undefined) {
        await tx.user.update({
          where: { id: parseInt(userId) },
          data: {
            fullName: fullName !== undefined ? fullName : undefined,
            phone: phone !== undefined ? phone : undefined,
          },
        });
      }

      return tx.patient.update({
        where: { userId: parseInt(userId) },
        data: {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender: gender !== undefined ? gender : undefined,
          address: address !== undefined ? address : undefined,
          insuranceNumber: insuranceNumber !== undefined ? insuranceNumber : undefined,
          bloodType: bloodType !== undefined ? bloodType : undefined,
          allergies: allergies !== undefined ? allergies : undefined,
          medicalHistory: medicalHistory !== undefined ? medicalHistory : undefined,
        },
      });
    });

    auditService.log({
      userId: parseInt(userId),
      action: 'UPDATE',
      entityType: 'Patient',
      entityId: patient.id,
      newValue: data,
      req,
    });

    return result;
  }
}

module.exports = new PatientService();
