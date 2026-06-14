/**
 * Doctor Service — Refactored with Repository Pattern
 */

const bcrypt = require('bcryptjs');
const doctorRepo = require('../repositories/doctor.repository');
const userRepo = require('../repositories/user.repository');
const scheduleRepo = require('../repositories/schedule.repository');
const timeSlotRepo = require('../repositories/timeslot.repository');
const leaveRepo = require('../repositories/leave.repository');
const auditService = require('./audit.service');
const prisma = require('../utils/prisma');

class DoctorService {
  async getAllDoctors(query) {
    const { specialtyId, search, limit, page = 1 } = query;
    let filter = {};

    if (specialtyId) {
      filter.specialtyId = parseInt(specialtyId);
    }

    // Tìm kiếm theo tên bác sĩ
    if (search) {
      filter.user = {
        fullName: { contains: search, mode: 'insensitive' },
      };
    }

    if (limit && !query.page) {
      // Legacy: chỉ có limit, không phân trang
      return doctorRepo.findAllWithUser(filter, { take: parseInt(limit) });
    }

    // Có phân trang
    return doctorRepo.findManyWithCount(filter, {
      include: {
        user: { select: { fullName: true, email: true, phone: true, avatar: true } },
        specialty: { select: { name: true, icon: true } },
      },
      orderBy: { rating: 'desc' },
      page,
      limit: limit || 20,
    });
  }

  async getDoctorById(id) {
    const doctor = await doctorRepo.findByIdWithDetails(id);
    if (!doctor) throw new Error('Không tìm thấy bác sĩ');
    return doctor;
  }

  async createDoctor(data, req = null) {
    const { email, password, fullName, phone, specialtyId } = data;

    // 1. Kiểm tra email
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error('Email đã được sử dụng!');
    }

    // 2. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Tạo User và Doctor dùng Transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, phone, fullName, passwordHash, role: 'DOCTOR' },
      });

      const doctor = await tx.doctor.create({
        data: { userId: user.id, specialtyId: parseInt(specialtyId) },
      });

      const { passwordHash: _, ...safeUser } = user;
      return { user: safeUser, doctor };
    });

    // Audit log
    auditService.log({
      userId: req?.user?.id,
      action: 'CREATE',
      entityType: 'Doctor',
      entityId: result.doctor.id,
      newValue: { email, fullName, specialtyId },
      req,
    });

    return result;
  }

  async updateDoctor(id, data, req = null) {
    const { fullName, phone, specialtyId, isActive } = data;

    const currentDoctor = await doctorRepo.findById(id);
    if (!currentDoctor) throw new Error('Không tìm thấy bác sĩ');

    const oldValue = { ...currentDoctor };

    const result = await prisma.$transaction(async (tx) => {
      if (fullName !== undefined || phone !== undefined) {
        await tx.user.update({
          where: { id: currentDoctor.userId },
          data: { fullName, phone },
        });
      }

      let docData = {};
      if (specialtyId !== undefined) docData.specialtyId = parseInt(specialtyId);
      if (isActive !== undefined) docData.isActive = isActive;

      return tx.doctor.update({
        where: { id: parseInt(id) },
        data: docData,
      });
    });

    auditService.log({
      userId: req?.user?.id,
      action: 'UPDATE',
      entityType: 'Doctor',
      entityId: parseInt(id),
      oldValue,
      newValue: data,
      req,
    });

    return result;
  }

  async getSchedules(doctorId) {
    return scheduleRepo.findByDoctorId(doctorId);
  }

  async getAvailableSlots(doctorId, dateStr) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // 1. Kiểm tra ngày lễ
    const isHoliday = await leaveRepo.findHolidayOnDate(date);
    if (isHoliday) return [];

    // 2. Kiểm tra bác sĩ nghỉ phép
    const isOnLeave = await leaveRepo.findApprovedLeaveOnDate(doctorId, date);
    if (isOnLeave) return [];

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = dayNames[date.getDay()];

    // 1. Tìm lịch làm việc theo thứ trong tuần
    const schedule = await scheduleRepo.findByDoctorAndDay(doctorId, dayOfWeek);
    if (!schedule) return [];

    // 2. Sinh ra danh sách slot từ startTime đến endTime
    const slots = [];
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const duration = schedule.slotDurationMinutes;

    let currentMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    while (currentMin + duration <= endMin) {
      const slotStart = `${String(Math.floor(currentMin / 60)).padStart(2, '0')}:${String(currentMin % 60).padStart(2, '0')}`;
      const slotEnd = `${String(Math.floor((currentMin + duration) / 60)).padStart(2, '0')}:${String((currentMin + duration) % 60).padStart(2, '0')}`;
      slots.push({ startTime: slotStart, endTime: slotEnd });
      currentMin += duration;
    }

    // 3. Tìm hoặc tạo TimeSlot và gắn trạng thái
    const result = [];
    for (const slot of slots) {
      let timeSlot = await timeSlotRepo.upsertSlot(doctorId, date, slot.startTime, slot.endTime);

      result.push({
        id: timeSlot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: timeSlot.status,
      });
    }

    return result;
  }

  async updateSchedules(doctorId, schedules, req = null) {
    const docId = parseInt(doctorId);
    const doctor = await doctorRepo.findById(docId);
    if (!doctor) throw new Error('Không tìm thấy bác sĩ');

    const result = await prisma.$transaction(async (tx) => {
      const updatedSchedules = [];
      const updatedDays = [];

      for (const sched of schedules) {
        updatedDays.push(sched.dayOfWeek);
        const item = await scheduleRepo.upsertSchedule(docId, sched, tx);
        updatedSchedules.push(item);
      }

      await scheduleRepo.deactivateExcept(docId, updatedDays, tx);

      return updatedSchedules;
    });

    auditService.log({
      userId: req?.user?.id,
      action: 'UPDATE',
      entityType: 'DoctorSchedule',
      entityId: docId,
      newValue: { schedules },
      req,
    });

    return result;
  }

  async deleteDoctor(id, req = null) {
    const doctor = await doctorRepo.findById(id);
    if (!doctor) throw new Error('Không tìm thấy bác sĩ');

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: doctor.userId },
        data: { isActive: false },
      });

      return tx.doctor.update({
        where: { id: parseInt(id) },
        data: { isActive: false },
      });
    });

    auditService.log({
      userId: req?.user?.id,
      action: 'DELETE',
      entityType: 'Doctor',
      entityId: parseInt(id),
      oldValue: { isActive: true },
      newValue: { isActive: false },
      req,
    });

    return result;
  }
}

module.exports = new DoctorService();
