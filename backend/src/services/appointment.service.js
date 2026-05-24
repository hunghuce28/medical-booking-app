const prisma = require('../utils/prisma');
const { createNotification } = require('./notification.service');

class AppointmentService {
  /**
   * Lấy danh sách tất cả lịch khám (Admin xem)
   */
  async getAllAppointments(query) {
    const { status, doctorId, date, page = 1, limit = 20 } = query;
    let filter = {};

    if (status) filter.status = status;
    if (doctorId) filter.doctorId = parseInt(doctorId);
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
  async createAppointment(data) {
    const { patientId, doctorId, timeSlotId, appointmentDate, symptoms } = data;

    // 1. Kiểm tra TimeSlot còn trống không
    const timeSlot = await prisma.timeSlot.findUnique({ where: { id: parseInt(timeSlotId) } });
    if (!timeSlot) throw new Error('Khung giờ không tồn tại');
    if (timeSlot.status !== 'AVAILABLE') throw new Error('Khung giờ này đã được đặt');

    // 2. Kiểm tra bệnh nhân có lịch trùng không
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: parseInt(patientId),
        appointmentDate: new Date(appointmentDate),
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });
    if (existingAppointment) throw new Error('Bạn đã có lịch khám vào ngày này rồi');

    // 3. Tạo Appointment + cập nhật TimeSlot → BOOKED (Transaction)
    const result = await prisma.$transaction(async (tx) => {
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
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true
      }
    });
    if (!appointment) throw new Error('Không tìm thấy lịch khám');

    // Kiểm tra phân quyền nếu người dùng hiện tại được truyền vào
    if (currentUser) {
      if (currentUser.role === 'PATIENT') {
        // Bệnh nhân chỉ được phép hủy lịch khám của chính mình
        if (status !== 'CANCELLED') {
          throw new Error('Bạn không có quyền cập nhật trạng thái này!');
        }
        if (appointment.patient.userId !== currentUser.id) {
          throw new Error('Bạn không có quyền chỉnh sửa lịch khám của người khác!');
        }
        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
          throw new Error('Lịch khám không ở trạng thái có thể hủy!');
        }
      }
    }

    const updateData = { status };
    if (cancelReason) updateData.cancelReason = cancelReason;

    // Nếu hủy → trả lại TimeSlot thành AVAILABLE
    if (status === 'CANCELLED' || status === 'REJECTED') {
      await prisma.timeSlot.update({
        where: { id: appointment.timeSlotId },
        data: { status: 'AVAILABLE' },
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: { include: { user: { select: { id: true } } } },
        doctor: { include: { user: { select: { id: true, fullName: true } } } },
        timeSlot: true
      }
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
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalPatients, totalDoctors, totalSpecialties, todayAppointments, completedToday, statusStats] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count({ where: { isActive: true } }),
      prisma.specialty.count({ where: { isActive: true } }),
      prisma.appointment.count({
        where: { appointmentDate: { gte: today, lt: tomorrow } }
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: today, lt: tomorrow },
          status: 'COMPLETED'
        }
      }),
      prisma.appointment.groupBy({
        by: ['status'],
        _count: { id: true },
      })
    ]);

    // Thống kê lịch khám 7 ngày gần nhất
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyAppointments = await prisma.appointment.groupBy({
      by: ['appointmentDate'],
      where: {
        appointmentDate: { gte: sevenDaysAgo, lt: tomorrow }
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
