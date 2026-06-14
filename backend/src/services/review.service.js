/**
 * Review Service — Refactored with Repository Pattern
 */

const reviewRepo = require('../repositories/review.repository');
const appointmentRepo = require('../repositories/appointment.repository');
const doctorRepo = require('../repositories/doctor.repository');
const auditService = require('./audit.service');
const prisma = require('../utils/prisma');

class ReviewService {
  async create(data, currentUser = null, req = null) {
    const { appointmentId, rating, comment } = data;

    // Kiểm tra appointment tồn tại và COMPLETED
    const appointment = await appointmentRepo.findById(appointmentId, {
      include: { patient: true },
    });
    if (!appointment) throw new Error('Không tìm thấy lịch khám');
    if (appointment.status !== 'COMPLETED') throw new Error('Chỉ được đánh giá sau khi khám xong');

    // Kiểm tra người đánh giá là chính bệnh nhân của lịch khám
    if (currentUser && appointment.patient.userId !== currentUser.id) {
      throw new Error('Bạn chỉ có thể đánh giá lịch khám của mình');
    }

    const patientId = appointment.patientId;
    const doctorId = appointment.doctorId;

    // Kiểm tra đã đánh giá chưa
    const existing = await reviewRepo.findByAppointmentId(appointmentId);
    if (existing) throw new Error('Bạn đã đánh giá lịch khám này rồi');

    // Validate rating
    const ratingInt = parseInt(rating);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      throw new Error('Đánh giá phải từ 1 đến 5 sao');
    }

    // Tạo review và cập nhật rating trong cùng transaction
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          appointmentId: parseInt(appointmentId),
          patientId: parseInt(patientId),
          doctorId: parseInt(doctorId),
          rating: ratingInt,
          comment,
        },
      });

      // Lock Doctor record before aggregating
      await tx.doctor.update({
        where: { id: parseInt(doctorId) },
        data: {},
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
        },
      });

      return newReview;
    });

    // Audit log
    auditService.log({
      userId: currentUser?.id,
      action: 'CREATE',
      entityType: 'Review',
      entityId: review.id,
      newValue: { appointmentId, doctorId, rating: ratingInt },
      req,
    });

    return review;
  }

  async getByDoctorId(doctorId, query = {}) {
    const { page = 1, limit = 10 } = query;
    return reviewRepo.findByDoctorId(doctorId, { page, limit });
  }
}

module.exports = new ReviewService();
