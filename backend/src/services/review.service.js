const prisma = require('../utils/prisma');

class ReviewService {
  async create(data, currentUser = null) {
    const { appointmentId, rating, comment } = data;

    // Kiểm tra appointment tồn tại và COMPLETED
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: { patient: true }
    });
    if (!appointment) throw new Error('Không tìm thấy lịch khám');
    if (appointment.status !== 'COMPLETED') throw new Error('Chỉ được đánh giá sau khi khám xong');

    // Kiểm tra người đánh giá là chính bệnh nhân của lịch khám
    if (currentUser && appointment.patient.userId !== currentUser.id) {
      throw new Error('Bạn chỉ có thể đánh giá lịch khám của mình');
    }

    // Lấy patientId và doctorId từ appointment (không tin tưởng req.body)
    const patientId = appointment.patientId;
    const doctorId = appointment.doctorId;

    // Kiểm tra đã đánh giá chưa
    const existing = await prisma.review.findUnique({ where: { appointmentId: parseInt(appointmentId) } });
    if (existing) throw new Error('Bạn đã đánh giá lịch khám này rồi');

    // Thêm B15: Validate rating
    const ratingInt = parseInt(rating);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      throw new Error('Đánh giá phải từ 1 đến 5 sao');
    }

    // Fix B14: Tạo review và cập nhật rating trong cùng transaction
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          appointmentId: parseInt(appointmentId),
          patientId: parseInt(patientId),
          doctorId: parseInt(doctorId),
          rating: ratingInt,
          comment,
        }
      });

      // Lock Doctor record by performing a dummy update before aggregating
      await tx.doctor.update({
        where: { id: parseInt(doctorId) },
        data: {}
      });

      // Cập nhật rating trung bình cho bác sĩ
      const avgResult = await tx.review.aggregate({
        where: { doctorId: parseInt(doctorId) },
        _avg: { rating: true },
        _count: { id: true },
      });

      await tx.doctor.update({
        where: { id: parseInt(doctorId) },
        data: {
          rating: avgResult._avg.rating || 0,
          totalReviews: avgResult._count.id,
        }
      });

      return newReview;
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
