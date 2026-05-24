const prisma = require('../utils/prisma');

class ReviewService {
  async create(data) {
    const { appointmentId, patientId, doctorId, rating, comment } = data;

    // Kiểm tra appointment tồn tại và COMPLETED
    const appointment = await prisma.appointment.findUnique({ where: { id: parseInt(appointmentId) } });
    if (!appointment) throw new Error('Không tìm thấy lịch khám');
    if (appointment.status !== 'COMPLETED') throw new Error('Chỉ được đánh giá sau khi khám xong');

    // Kiểm tra đã đánh giá chưa
    const existing = await prisma.review.findUnique({ where: { appointmentId: parseInt(appointmentId) } });
    if (existing) throw new Error('Bạn đã đánh giá lịch khám này rồi');

    // Tạo review
    const review = await prisma.review.create({
      data: {
        appointmentId: parseInt(appointmentId),
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId),
        rating: parseInt(rating),
        comment,
      }
    });

    // Cập nhật rating trung bình cho bác sĩ
    const avgResult = await prisma.review.aggregate({
      where: { doctorId: parseInt(doctorId) },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.doctor.update({
      where: { id: parseInt(doctorId) },
      data: {
        rating: avgResult._avg.rating || 0,
        totalReviews: avgResult._count.id,
      }
    });

    return review;
  }

  async getByDoctorId(doctorId, query = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { doctorId: parseInt(doctorId) },
        include: {
          patient: { include: { user: { select: { fullName: true, avatar: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count({ where: { doctorId: parseInt(doctorId) } })
    ]);

    return { reviews, total };
  }
}

module.exports = new ReviewService();
