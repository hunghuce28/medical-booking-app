const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

class DoctorService {
  async getAllDoctors(query) {
    const { specialtyId, limit } = query;
    let filter = {}; // Bỏ isActive: true để admin thấy cả bác sĩ đã khóa
    
    if (specialtyId) {
      filter.specialtyId = parseInt(specialtyId);
    }

    return await prisma.doctor.findMany({
      where: filter,
      include: {
        user: { select: { fullName: true, email: true, phone: true, avatar: true } },
        specialty: { select: { name: true, icon: true } }
      },
      take: limit ? parseInt(limit) : undefined,
      orderBy: { rating: 'desc' }
    });
  }

  async getDoctorById(id) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { fullName: true, email: true, phone: true, avatar: true } },
        specialty: true,
        schedules: true
      }
    });

    if (!doctor) throw new Error('Không tìm thấy bác sĩ');
    return doctor;
  }

  async createDoctor(data) {
    const { email, password, fullName, phone, specialtyId } = data;

    // 1. Kiểm tra email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email đã được sử dụng!');
    }

    // 2. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Tạo User và Doctor dùng Transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone,
          fullName,
          passwordHash,
          role: 'DOCTOR',
        }
      });

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          specialtyId: parseInt(specialtyId),
        }
      });

      return { user, doctor };
    });

    return result;
  }

  async updateDoctor(id, data) {
    const { fullName, phone, specialtyId, isActive } = data;
    
    // Tìm doctor hiện tại để lấy userId
    const currentDoctor = await prisma.doctor.findUnique({ where: { id: parseInt(id) } });
    if (!currentDoctor) throw new Error('Không tìm thấy bác sĩ');

    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật thông tin User
      if (fullName !== undefined || phone !== undefined) {
        await tx.user.update({
          where: { id: currentDoctor.userId },
          data: { fullName, phone }
        });
      }

      // Cập nhật thông tin Doctor
      let docData = {};
      if (specialtyId !== undefined) docData.specialtyId = parseInt(specialtyId);
      if (isActive !== undefined) docData.isActive = isActive;

      const updatedDoctor = await tx.doctor.update({
        where: { id: parseInt(id) },
        data: docData
      });

      return updatedDoctor;
    });

    return result;
  }

  async getSchedules(doctorId) {
    return await prisma.doctorSchedule.findMany({
      where: { doctorId: parseInt(doctorId), isActive: true },
      orderBy: { dayOfWeek: 'asc' }
    });
  }

  async getAvailableSlots(doctorId, dateStr) {
    const date = new Date(dateStr);
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = dayNames[date.getDay()];

    // 1. Tìm lịch làm việc theo thứ trong tuần
    const schedule = await prisma.doctorSchedule.findFirst({
      where: { doctorId: parseInt(doctorId), dayOfWeek, isActive: true }
    });

    if (!schedule) return []; // Bác sĩ không làm việc ngày này

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

    // 3. Tìm các slot đã được đặt (BOOKED) trong ngày này
    const bookedSlots = await prisma.timeSlot.findMany({
      where: { doctorId: parseInt(doctorId), date, status: { not: 'AVAILABLE' } }
    });
    const bookedTimes = new Set(bookedSlots.map(s => s.startTime));

    // 4. Tìm hoặc tạo TimeSlot và gắn trạng thái
    const result = [];
    for (const slot of slots) {
      let timeSlot = await prisma.timeSlot.findUnique({
        where: { doctorId_date_startTime: { doctorId: parseInt(doctorId), date, startTime: slot.startTime } }
      });

      if (!timeSlot) {
        timeSlot = await prisma.timeSlot.create({
          data: { doctorId: parseInt(doctorId), date, startTime: slot.startTime, endTime: slot.endTime, status: 'AVAILABLE' }
        });
      }

      result.push({
        id: timeSlot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: timeSlot.status,
      });
    }

    return result;
  }

  async deleteDoctor(id) {
    // Soft delete: chuyển isActive thành false
    return await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
  }
}

module.exports = new DoctorService();
