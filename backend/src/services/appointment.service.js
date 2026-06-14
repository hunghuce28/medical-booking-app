/**
 * Appointment Service — Refactored with Repository Pattern
 * Handles booking, status management, and dashboard statistics
 */

const appointmentRepo = require('../repositories/appointment.repository');
const doctorRepo = require('../repositories/doctor.repository');
const patientRepo = require('../repositories/patient.repository');
const timeSlotRepo = require('../repositories/timeslot.repository');
const auditService = require('./audit.service');
const notificationQueue = require('../queues/notification.queue');
const prisma = require('../utils/prisma');
const { Prisma } = require('@prisma/client');

class AppointmentService {
  /**
   * Lấy danh sách tất cả lịch khám (Admin/Bác sĩ xem)
   */
  async getAllAppointments(query, currentUser = null) {
    const { status, doctorId, date, page = 1, limit = 20 } = query;
    let filter = {};

    if (currentUser && currentUser.role === 'DOCTOR') {
      const doctor = await doctorRepo.findByUserId(currentUser.id);
      if (doctor) filter.doctorId = doctor.id;
    } else if (doctorId) {
      filter.doctorId = parseInt(doctorId);
    }

    if (status) filter.status = status;
    if (date) filter.appointmentDate = new Date(date);

    return appointmentRepo.findManyWithCount(filter, {
      include: {
        patient: {
          include: {
            user: { select: { fullName: true, phone: true, email: true } },
          },
        },
        doctor: {
          include: {
            user: { select: { fullName: true } },
            specialty: { select: { name: true } },
          },
        },
        timeSlot: true,
      },
      orderBy: { createdAt: 'desc' },
      page,
      limit,
    });
  }

  /**
   * Bệnh nhân đặt lịch khám — với Pessimistic Locking chống Double Booking
   */
  async createAppointment(data, currentUser = null, req = null) {
    const { doctorId, timeSlotId, appointmentDate, symptoms } = data;

    // Ép patientId từ token đăng nhập (chống mạo danh)
    let patientId = data.patientId;
    if (currentUser) {
      const patient = await patientRepo.findByUserId(currentUser.id);
      if (!patient) throw new Error('Không tìm thấy hồ sơ bệnh nhân của bạn');
      patientId = patient.id;
    }
    if (!patientId) throw new Error('Thiếu thông tin bệnh nhân');

    // Transaction với Pessimistic Locking (SELECT ... FOR UPDATE)
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // 1. Pessimistic Lock: SELECT FOR UPDATE trên TimeSlot
        const lockedSlot = await tx.$queryRaw`
          SELECT * FROM time_slots 
          WHERE id = ${parseInt(timeSlotId)} 
          FOR UPDATE
        `;
        
        if (!lockedSlot[0]) throw new Error('Khung giờ không tồn tại');
        if (lockedSlot[0].status !== 'AVAILABLE') throw new Error('Khung giờ này đã được đặt');

        // 2. Kiểm tra bệnh nhân có lịch trùng không
        const existingAppointment = await tx.appointment.findFirst({
          where: {
            patientId: parseInt(patientId),
            doctorId: parseInt(doctorId),
            appointmentDate: new Date(appointmentDate),
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        });
        if (existingAppointment) throw new Error('Bạn đã có lịch khám vào ngày này rồi');

        // 3. Tạo Appointment + cập nhật TimeSlot → BOOKED (atomic)
        const appointment = await tx.appointment.create({
          data: {
            patientId: parseInt(patientId),
            doctorId: parseInt(doctorId),
            timeSlotId: parseInt(timeSlotId),
            appointmentDate: new Date(appointmentDate),
            symptoms,
            status: 'PENDING',
          },
        });

        await tx.timeSlot.update({
          where: { id: parseInt(timeSlotId) },
          data: { status: 'BOOKED' },
        });

        await tx.appointmentHistory.create({
          data: {
            appointmentId: appointment.id,
            status: 'PENDING',
            changedByUserId: currentUser ? parseInt(currentUser.id) : null,
            note: 'Tạo mới lịch hẹn khám bệnh',
          },
        });

        return appointment;
      });
    } catch (error) {
      if (error.code === 'P2002')
        throw new Error('Khung giờ này vừa có người đặt mất rồi, vui lòng chọn giờ khác!');
      throw error;
    }

    // Audit log
    auditService.log({
      userId: currentUser?.id,
      action: 'CREATE',
      entityType: 'Appointment',
      entityId: result.id,
      newValue: { doctorId, timeSlotId, appointmentDate, symptoms },
      req,
    });

    // Notification Queue (non-blocking)
    this._sendBookingNotifications(result.id);

    return result;
  }

  /**
   * Cập nhật trạng thái lịch khám (Admin/Bác sĩ duyệt/từ chối/hoàn thành, Bệnh nhân tự hủy)
   */
  async updateStatus(id, status, cancelReason = null, currentUser = null, req = null) {
    // Bảng chuyển đổi trạng thái hợp lệ (State Machine)
    const VALID_TRANSITIONS = {
      PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      REJECTED: [],
      CANCELLED: [],
      COMPLETED: [],
      NO_SHOW: [],
    };

    const appointment = await appointmentRepo.findById(id, {
      include: { patient: true, doctor: true },
    });
    if (!appointment) throw new Error('Không tìm thấy lịch khám');

    const oldStatus = appointment.status;

    // Kiểm tra chuyển trạng thái hợp lệ
    const allowedStatuses = VALID_TRANSITIONS[appointment.status] || [];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Không thể chuyển từ trạng thái "${appointment.status}" sang "${status}"`);
    }

    // Kiểm tra phân quyền
    if (currentUser) {
      if (currentUser.role === 'PATIENT') {
        if (status !== 'CANCELLED') {
          throw new Error('Bạn không có quyền cập nhật trạng thái này!');
        }
        if (appointment.patient.userId !== currentUser.id) {
          throw new Error('Bạn không có quyền chỉnh sửa lịch khám của người khác!');
        }
      } else if (currentUser.role === 'DOCTOR') {
        if (appointment.doctor.userId !== currentUser.id) {
          throw new Error('Bạn không có quyền thao tác trên lịch khám của bác sĩ khác!');
        }
      }
    }

    // Bọc trong Transaction để đảm bảo tính toàn vẹn
    const updatedAppointment = await prisma.$transaction(async (tx) => {
      const updateData = { status };
      if (cancelReason) updateData.cancelReason = cancelReason;

      const appt = await tx.appointment.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          patient: { include: { user: { select: { id: true } } } },
          doctor: { include: { user: { select: { id: true, fullName: true } } } },
          timeSlot: true,
        },
      });

      // Nếu hủy hoặc không đến → trả lại TimeSlot thành AVAILABLE
      if (status === 'CANCELLED' || status === 'REJECTED' || status === 'NO_SHOW') {
        await tx.timeSlot.update({
          where: { id: appointment.timeSlotId },
          data: { status: 'AVAILABLE' },
        });
      }

      await tx.appointmentHistory.create({
        data: {
          appointmentId: appt.id,
          status,
          changedByUserId: currentUser ? parseInt(currentUser.id) : null,
          note: cancelReason ? `Lý do hủy: ${cancelReason}` : `Trạng thái thay đổi thành ${status}`,
        },
      });

      return appt;
    });

    // Audit log — ghi nhận thay đổi trạng thái
    auditService.logStatusChange({
      userId: currentUser?.id,
      entityType: 'Appointment',
      entityId: parseInt(id),
      oldStatus,
      newStatus: status,
      req,
    });

    // Notification Queue (non-blocking)
    this._sendStatusNotifications(updatedAppointment, status, cancelReason);

    return updatedAppointment;
  }

  /**
   * Bệnh nhân xem lịch khám của mình
   */
  async getPatientAppointments(userId, query) {
    const { status, page = 1, limit = 20 } = query;
    const filter = status ? { status } : {};
    return appointmentRepo.findByPatientId(userId, filter, { page, limit });
  }

  /**
   * Lấy thống kê cho Dashboard (mở rộng: revenue, top doctors, cancellation rate)
   */
  async getDashboardStats(currentUser = null) {
    let doctorFilter = {};
    if (currentUser && currentUser.role === 'DOCTOR') {
      const doctor = await doctorRepo.findByUserId(currentUser.id);
      if (doctor) doctorFilter = { doctorId: doctor.id };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Tính ngày đầu tháng
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let patientsCountQuery =
      currentUser && currentUser.role === 'DOCTOR'
        ? patientRepo.count({ appointments: { some: doctorFilter } })
        : patientRepo.count();

    const [
      totalPatients,
      totalDoctors,
      totalSpecialties,
      todayAppointments,
      completedToday,
      statusStats,
      totalCompleted,
      totalCancelled,
      totalAll,
    ] = await Promise.all([
      patientsCountQuery,
      doctorRepo.count({ isActive: true }),
      prisma.specialty.count({ where: { isActive: true } }),
      appointmentRepo.count({ appointmentDate: { gte: today, lt: tomorrow }, ...doctorFilter }),
      appointmentRepo.count({
        appointmentDate: { gte: today, lt: tomorrow },
        status: 'COMPLETED',
        ...doctorFilter,
      }),
      appointmentRepo.countByStatusGrouped(doctorFilter),
      // Revenue & cancellation rate data
      appointmentRepo.count({ status: 'COMPLETED', ...doctorFilter }),
      appointmentRepo.count({ status: 'CANCELLED', ...doctorFilter }),
      appointmentRepo.count(doctorFilter),
    ]);

    // Thống kê lịch khám 7 ngày gần nhất
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyAppointments = await appointmentRepo.countByDateRange(
      { gte: sevenDaysAgo, lt: tomorrow },
      doctorFilter
    );

    // Revenue tháng này (tổng phí khám của các appointment COMPLETED)
    let monthlyRevenue = 0;
    try {
      const doctorCondition = doctorFilter.doctorId
        ? Prisma.sql`AND a."doctorId" = ${doctorFilter.doctorId}`
        : Prisma.empty;

      const revenueResult = await prisma.$queryRaw`
        SELECT COALESCE(SUM(d."consultationFee"), 0)::float as revenue
        FROM appointments a
        JOIN doctors d ON a."doctorId" = d.id
        WHERE a.status = 'COMPLETED'
        AND a."appointmentDate" >= ${firstDayOfMonth}
        AND a."appointmentDate" < ${tomorrow}
        ${doctorCondition}
      `;
      monthlyRevenue = revenueResult[0]?.revenue || 0;
    } catch {
      // Fallback nếu raw query lỗi
      monthlyRevenue = 0;
    }

    // Top 5 bác sĩ (theo số ca hoàn thành)
    let topDoctors = [];
    try {
      topDoctors = await prisma.$queryRaw`
        SELECT d.id, u."fullName", s.name as specialty, 
               COUNT(a.id)::int as "completedCount", d.rating
        FROM doctors d
        JOIN users u ON d."userId" = u.id
        JOIN specialties s ON d."specialtyId" = s.id
        LEFT JOIN appointments a ON a."doctorId" = d.id AND a.status = 'COMPLETED'
        WHERE d."isActive" = true
        GROUP BY d.id, u."fullName", s.name, d.rating
        ORDER BY "completedCount" DESC
        LIMIT 5
      `;
    } catch {
      topDoctors = [];
    }

    // Top chuyên khoa (theo số ca khám)
    let topSpecialties = [];
    try {
      topSpecialties = await prisma.$queryRaw`
        SELECT s.id, s.name, COUNT(a.id)::int as "appointmentCount"
        FROM specialties s
        JOIN doctors d ON d."specialtyId" = s.id
        LEFT JOIN appointments a ON a."doctorId" = d.id
        WHERE s."isActive" = true
        GROUP BY s.id, s.name
        ORDER BY "appointmentCount" DESC
        LIMIT 5
      `;
    } catch {
      topSpecialties = [];
    }

    // Tỷ lệ hủy lịch
    const cancellationRate = totalAll > 0 ? Math.round((totalCancelled / totalAll) * 100 * 10) / 10 : 0;

    const statusMap = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      REJECTED: 'Từ chối',
      CANCELLED: 'Đã hủy',
      COMPLETED: 'Hoàn thành',
      NO_SHOW: 'Không đến khám',
    };

    const appointmentsByStatus = statusStats.map((item) => ({
      name: statusMap[item.status] || item.status,
      value: item._count.id,
    }));

    return {
      totalPatients,
      totalDoctors,
      totalSpecialties,
      todayAppointments,
      completedToday,
      monthlyRevenue,
      cancellationRate,
      topDoctors,
      topSpecialties,
      weeklyAppointments: weeklyAppointments.map((item) => ({
        date: new Date(item.appointmentDate).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
        }),
        count: item._count.id,
      })),
      appointmentsByStatus,
    };
  }

  /**
   * Gửi notification sau khi đặt lịch thành công (non-blocking qua queue)
   */
  async _sendBookingNotifications(appointmentId) {
    try {
      const details = await appointmentRepo.findByIdWithDetails(appointmentId);
      if (!details) return;

      const timeStr = `${details.timeSlot.startTime} - ${details.timeSlot.endTime}`;
      const dateStr = new Date(details.appointmentDate).toLocaleDateString('vi-VN');

      notificationQueue.enqueue({
        userId: details.patient.user.id,
        title: 'Đặt lịch khám thành công',
        message: `Lịch hẹn khám với bác sĩ ${details.doctor.user.fullName} vào lúc ${timeStr} ngày ${dateStr} đã được gửi đi và đang chờ xác nhận.`,
        type: 'APPOINTMENT_CREATED',
        data: { appointmentId },
      });

      notificationQueue.enqueue({
        userId: details.doctor.user.id,
        title: 'Lịch khám mới chờ duyệt',
        message: `Bệnh nhân ${details.patient.user.fullName} đã đặt lịch khám vào lúc ${timeStr} ngày ${dateStr}.`,
        type: 'APPOINTMENT_CREATED',
        data: { appointmentId },
      });
    } catch (err) {
      console.error('Lỗi khi tạo thông báo đặt lịch:', err);
    }
  }

  /**
   * Gửi notification khi cập nhật trạng thái (non-blocking qua queue)
   */
  _sendStatusNotifications(appointment, status, cancelReason) {
    const timeStr = `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`;
    const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('vi-VN');
    const doctorName = appointment.doctor.user.fullName;

    const notifications = [];

    if (status === 'CONFIRMED') {
      notifications.push({
        userId: appointment.patient.user.id,
        title: 'Lịch khám đã được xác nhận',
        message: `Lịch hẹn khám với bác sĩ ${doctorName} vào lúc ${timeStr} ngày ${dateStr} đã được xác nhận.`,
        type: 'APPOINTMENT_CONFIRMED',
        data: { appointmentId: appointment.id },
      });
    } else if (status === 'REJECTED') {
      notifications.push({
        userId: appointment.patient.user.id,
        title: 'Lịch khám bị từ chối',
        message: `Lịch hẹn khám với bác sĩ ${doctorName} vào lúc ${timeStr} ngày ${dateStr} đã bị từ chối.${cancelReason ? ` Lý do: ${cancelReason}` : ''}`,
        type: 'APPOINTMENT_REJECTED',
        data: { appointmentId: appointment.id },
      });
    } else if (status === 'CANCELLED') {
      notifications.push({
        userId: appointment.patient.user.id,
        title: 'Lịch khám đã bị hủy',
        message: `Lịch hẹn khám với bác sĩ ${doctorName} vào lúc ${timeStr} ngày ${dateStr} đã bị hủy.${cancelReason ? ` Lý do: ${cancelReason}` : ''}`,
        type: 'APPOINTMENT_CANCELLED',
        data: { appointmentId: appointment.id },
      });
      notifications.push({
        userId: appointment.doctor.user.id,
        title: 'Lịch khám đã bị hủy',
        message: `Lịch hẹn khám vào lúc ${timeStr} ngày ${dateStr} đã bị hủy.${cancelReason ? ` Lý do: ${cancelReason}` : ''}`,
        type: 'APPOINTMENT_CANCELLED',
        data: { appointmentId: appointment.id },
      });
    } else if (status === 'COMPLETED') {
      notifications.push({
        userId: appointment.patient.user.id,
        title: 'Khám bệnh hoàn thành',
        message: `Lịch hẹn khám với bác sĩ ${doctorName} đã hoàn thành. Bạn có thể xem kết quả khám và đơn thuốc của mình.`,
        type: 'APPOINTMENT_COMPLETED',
        data: { appointmentId: appointment.id },
      });
    } else if (status === 'NO_SHOW') {
      notifications.push({
        userId: appointment.patient.user.id,
        title: 'Vắng mặt không báo trước',
        message: `Lịch hẹn khám với bác sĩ ${doctorName} vào lúc ${timeStr} ngày ${dateStr} đã bị đánh dấu là vắng mặt.`,
        type: 'GENERAL',
        data: { appointmentId: appointment.id },
      });
    }

    if (notifications.length > 0) {
      notificationQueue.enqueueBatch(notifications);
    }
  }
}

module.exports = new AppointmentService();
