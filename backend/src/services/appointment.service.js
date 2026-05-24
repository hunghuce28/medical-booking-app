const prisma = require('../utils/prisma');

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

    return result;
  }

  /**
   * Cập nhật trạng thái lịch khám (Admin/Bác sĩ duyệt/từ chối/hoàn thành)
   */
  async updateStatus(id, status, cancelReason = null) {
    const appointment = await prisma.appointment.findUnique({ where: { id: parseInt(id) } });
    if (!appointment) throw new Error('Không tìm thấy lịch khám');

    const updateData = { status };
    if (cancelReason) updateData.cancelReason = cancelReason;

    // Nếu hủy → trả lại TimeSlot thành AVAILABLE
    if (status === 'CANCELLED' || status === 'REJECTED') {
      await prisma.timeSlot.update({
        where: { id: appointment.timeSlotId },
        data: { status: 'AVAILABLE' },
      });
    }

    return await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
  }

  /**
   * Lấy thống kê cho Dashboard
   */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalPatients, totalDoctors, totalSpecialties, todayAppointments, completedToday] = await Promise.all([
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

    return {
      totalPatients,
      totalDoctors,
      totalSpecialties,
      todayAppointments,
      completedToday,
      weeklyAppointments: weeklyAppointments.map(item => ({
        date: item.appointmentDate,
        count: item._count.id,
      })),
    };
  }
}

module.exports = new AppointmentService();
