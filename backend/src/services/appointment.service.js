const prisma = require('../utils/prisma');
const { createNotification } = require('./notification.service');

class AppointmentService {
  /**
   * Lấy danh sách tất cả lịch khám (Admin xem)
   */
  async getAllAppointments(query, currentUser = null) {
    const { status, doctorId, date, page = 1, limit = 20 } = query;
    let filter = {};

    if (currentUser && currentUser.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: currentUser.id } });
      if (doctor) filter.doctorId = doctor.id;
    } else if (doctorId) {
      filter.doctorId = parseInt(doctorId);
    }

    if (status) filter.status = status;
    if (date) filter.appointmentDate = new Date(date);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: filter,
        include: {
          patient: {
            include: {
              user: { select: { fullName: true, phone: true, email: true } }
            }
          },
          doctor: {
            include: {
              user: { select: { fullName: true } },
              specialty: { select: { name: true } }
            }
          },
          timeSlot: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.appointment.count({ where: filter })
    ]);

    return { appointments, total, page: parseInt(page), limit: parseInt(limit) };
  }

  /**
   * Bệnh nhân đặt lịch khám
   */
  async createAppointment(data, currentUser = null) {
    const { doctorId, timeSlotId, appointmentDate, symptoms } = data;

    // Ép patientId từ token đăng nhập (chống mạo danh)
    let patientId = data.patientId;
    if (currentUser) {
      const patient = await prisma.patient.findUnique({ where: { userId: currentUser.id } });
      if (!patient) throw new Error('Không tìm thấy hồ sơ bệnh nhân của bạn');
      patientId = patient.id;
    }
    if (!patientId) throw new Error('Thiếu thông tin bệnh nhân');

    // Đưa TẤT CẢ kiểm tra vào trong Transaction để chống Race Condition
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // 1. Kiểm tra TimeSlot còn trống không (trong transaction → có khóa)
        const timeSlot = await tx.timeSlot.findUnique({ where: { id: parseInt(timeSlotId) } });
        if (!timeSlot) throw new Error('Khung giờ không tồn tại');
        if (timeSlot.status !== 'AVAILABLE') throw new Error('Khung giờ này đã được đặt');

        // 2. Kiểm tra bệnh nhân có lịch trùng không
        const existingAppointment = await tx.appointment.findFirst({
          where: {
            patientId: parseInt(patientId),
            doctorId: parseInt(doctorId),
            appointmentDate: new Date(appointmentDate),
            status: { in: ['PENDING', 'CONFIRMED'] }
          }
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

        return appointment;
      });
    } catch (error) {
      if (error.code === 'P2002') throw new Error('Khung giờ này vừa có người đặt mất rồi, vui lòng chọn giờ khác!');
      throw error;
    }

    // Tạo thông báo tự động (chạy background sau khi đặt lịch thành công)
    prisma.appointment.findUnique({
      where: { id: result.id },
      include: {
        patient: { include: { user: { select: { id: true, fullName: true } } } },
        doctor: { include: { user: { select: { id: true, fullName: true } } } },
        timeSlot: true
      }
    }).then(async (details) => {
      if (details) {
        const timeStr = `${details.timeSlot.startTime} - ${details.timeSlot.endTime}`;
        const dateStr = new Date(details.appointmentDate).toLocaleDateString('vi-VN');

        // Gửi cho bệnh nhân
        await createNotification({
          userId: details.patient.user.id,
          title: 'Đặt lịch khám thành công',
          message: `Lịch hẹn khám với bác sĩ ${details.doctor.user.fullName} vào lúc ${timeStr} ngày ${dateStr} đã được gửi đi và đang chờ xác nhận.`,
          type: 'APPOINTMENT_CREATED',
          data: { appointmentId: result.id }
        });

        // Gửi cho bác sĩ
        await createNotification({
          userId: details.doctor.user.id,
          title: 'Lịch khám mới chờ duyệt',
          message: `Bệnh nhân ${details.patient.user.fullName} đã đặt lịch khám vào lúc ${timeStr} ngày ${dateStr}.`,
          type: 'APPOINTMENT_CREATED',
          data: { appointmentId: result.id }
        });
      }
    }).catch(err => console.error('Lỗi khi tạo thông báo đặt lịch:', err));

    return result;
  }

  /**
   * Cập nhật trạng thái lịch khám (Admin/Bác sĩ duyệt/từ chối/hoàn thành, Bệnh nhân tự hủy)
   */
  async updateStatus(id, status, cancelReason = null, currentUser = null) {
    // Bảng chuyển đổi trạng thái hợp lệ (State Machine)
    const VALID_TRANSITIONS = {
      PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      REJECTED: [],
      CANCELLED: [],
      COMPLETED: [],
      NO_SHOW: [],
    };

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        doctor: true,
      }
    });
    if (!appointment) throw new Error('Không tìm thấy lịch khám');

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
        // Bác sĩ chỉ được duyệt/từ chối/hoàn thành lịch của CHÍNH MÌNH
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
          timeSlot: true
        }
      });

      // Nếu hủy hoặc không đến → trả lại TimeSlot thành AVAILABLE
      if (status === 'CANCELLED' || status === 'REJECTED' || status === 'NO_SHOW') {
        await tx.timeSlot.update({
          where: { id: appointment.timeSlotId },
          data: { status: 'AVAILABLE' },
        });
      }

      return appt;
    });

    // Tạo thông báo cập nhật trạng thái (chạy background)
    Promise.resolve().then(async () => {
      const timeStr = `${updatedAppointment.timeSlot.startTime} - ${updatedAppointment.timeSlot.endTime}`;
      const dateStr = new Date(updatedAppointment.appointmentDate).toLocaleDateString('vi-VN');
      
      let title = '';
      let message = '';
      let type = 'GENERAL';
      let targetUserId = updatedAppointment.patient.user.id; // Mặc định gửi cho bệnh nhân

      if (status === 'CONFIRMED') {
        title = 'Lịch khám đã được xác nhận';
        message = `Lịch hẹn khám với bác sĩ ${updatedAppointment.doctor.user.fullName} vào lúc ${timeStr} ngày ${dateStr} đã được xác nhận.`;
        type = 'APPOINTMENT_CONFIRMED';
      } else if (status === 'REJECTED') {
        title = 'Lịch khám bị từ chối';
        message = `Lịch hẹn khám với bác sĩ ${updatedAppointment.doctor.user.fullName} vào lúc ${timeStr} ngày ${dateStr} đã bị từ chối.${cancelReason ? ` Lý do: ${cancelReason}` : ''}`;
        type = 'APPOINTMENT_REJECTED';
      } else if (status === 'CANCELLED') {
        title = 'Lịch khám đã bị hủy';
        message = `Lịch hẹn khám với bác sĩ ${updatedAppointment.doctor.user.fullName} vào lúc ${timeStr} ngày ${dateStr} đã bị hủy.${cancelReason ? ` Lý do: ${cancelReason}` : ''}`;
        type = 'APPOINTMENT_CANCELLED';
        
        // Gửi thông báo cho bác sĩ về việc hủy lịch
        await createNotification({
          userId: updatedAppointment.doctor.user.id,
          title: 'Lịch khám đã bị hủy',
          message: `Lịch hẹn khám của bệnh nhân vào lúc ${timeStr} ngày ${dateStr} đã bị hủy.${cancelReason ? ` Lý do: ${cancelReason}` : ''}`,
          type: 'APPOINTMENT_CANCELLED',
          data: { appointmentId: updatedAppointment.id }
        });
      } else if (status === 'COMPLETED') {
        title = 'Khám bệnh hoàn thành';
        message = `Lịch hẹn khám với bác sĩ ${updatedAppointment.doctor.user.fullName} đã hoàn thành. Bạn có thể xem kết quả khám và đơn thuốc của mình.`;
        type = 'APPOINTMENT_COMPLETED';
      } else if (status === 'NO_SHOW') {
        title = 'Vắng mặt không báo trước';
        message = `Lịch hẹn khám với bác sĩ ${updatedAppointment.doctor.user.fullName} vào lúc ${timeStr} ngày ${dateStr} đã bị đánh dấu là vắng mặt vì bạn không đến đúng giờ. Vui lòng liên hệ bác sĩ nếu có sai sót.`;
        type = 'GENERAL';
      }

      if (title && message) {
        await createNotification({
          userId: targetUserId,
          title,
          message,
          type,
          data: { appointmentId: updatedAppointment.id }
        });
      }
    }).catch(err => console.error('Lỗi khi tạo thông báo cập nhật trạng thái:', err));

    return updatedAppointment;
  }

  /**
   * Bệnh nhân xem lịch khám của mình
   */
  async getPatientAppointments(userId, query) {
    const { status, page = 1, limit = 20 } = query;
    const patient = await prisma.patient.findUnique({ where: { userId: parseInt(userId) } });
    if (!patient) {
      return { appointments: [], total: 0, page: parseInt(page), limit: parseInt(limit) };
    }

    let filter = { patientId: patient.id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: filter,
        include: {
          doctor: {
            include: {
              user: { select: { fullName: true, avatar: true } },
              specialty: { select: { name: true } }
            }
          },
          timeSlot: true,
          medicalRecord: true,
        },
        orderBy: { appointmentDate: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.appointment.count({ where: filter })
    ]);

    return { appointments, total, page: parseInt(page), limit: parseInt(limit) };
  }

  /**
   * Lấy thống kê cho Dashboard
   */
  async getDashboardStats(currentUser = null) {
    let doctorFilter = {};
    if (currentUser && currentUser.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: currentUser.id } });
      if (doctor) doctorFilter = { doctorId: doctor.id };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let patientsCountQuery = currentUser && currentUser.role === 'DOCTOR' 
      ? prisma.patient.count({ where: { appointments: { some: doctorFilter } } })
      : prisma.patient.count();

    const [totalPatients, totalDoctors, totalSpecialties, todayAppointments, completedToday, statusStats] = await Promise.all([
      patientsCountQuery,
      prisma.doctor.count({ where: { isActive: true } }),
      prisma.specialty.count({ where: { isActive: true } }),
      prisma.appointment.count({
        where: { appointmentDate: { gte: today, lt: tomorrow }, ...doctorFilter }
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: today, lt: tomorrow },
          status: 'COMPLETED',
          ...doctorFilter
        }
      }),
      prisma.appointment.groupBy({
        by: ['status'],
        where: doctorFilter,
        _count: { id: true },
      })
    ]);

    // Thống kê lịch khám 7 ngày gần nhất
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyAppointments = await prisma.appointment.groupBy({
      by: ['appointmentDate'],
      where: {
        appointmentDate: { gte: sevenDaysAgo, lt: tomorrow },
        ...doctorFilter
      },
      _count: { id: true },
      orderBy: { appointmentDate: 'asc' }
    });

    const statusMap = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      REJECTED: 'Từ chối',
      CANCELLED: 'Đã hủy',
      COMPLETED: 'Hoàn thành',
      NO_SHOW: 'Không đến khám'
    };

    const appointmentsByStatus = statusStats.map(item => ({
      name: statusMap[item.status] || item.status,
      value: item._count.id
    }));

    return {
      totalPatients,
      totalDoctors,
      totalSpecialties,
      todayAppointments,
      completedToday,
      weeklyAppointments: weeklyAppointments.map(item => ({
        date: new Date(item.appointmentDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        count: item._count.id,
      })),
      appointmentsByStatus,
    };
  }
}

module.exports = new AppointmentService();
