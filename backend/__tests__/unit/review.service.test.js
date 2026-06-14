/**
 * Review Service — Unit Tests
 */

jest.mock('../../src/repositories/review.repository');
jest.mock('../../src/repositories/appointment.repository');
jest.mock('../../src/repositories/doctor.repository');
jest.mock('../../src/services/audit.service');
jest.mock('../../src/utils/prisma', () => ({
  $transaction: jest.fn((fn) => fn({
    review: {
      create: jest.fn().mockResolvedValue({ id: 1, rating: 5 }),
      aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.5 }, _count: { id: 10 } }),
    },
    doctor: {
      update: jest.fn().mockResolvedValue({}),
    },
  })),
}));

const reviewRepo = require('../../src/repositories/review.repository');
const appointmentRepo = require('../../src/repositories/appointment.repository');
const auditService = require('../../src/services/audit.service');

process.env.JWT_SECRET = 'test-secret-key';
const reviewService = require('../../src/services/review.service');

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auditService.log.mockResolvedValue(undefined);
  });

  describe('create', () => {
    it('should reject review for non-completed appointment', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'PENDING',
        patient: { userId: 1 },
      });

      await expect(
        reviewService.create(
          { appointmentId: 1, rating: 5 },
          { id: 1, role: 'PATIENT' }
        )
      ).rejects.toThrow('Chỉ được đánh giá sau khi khám xong');
    });

    it('should reject review from wrong patient', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'COMPLETED',
        patient: { userId: 999 },
        patientId: 1,
        doctorId: 2,
      });

      await expect(
        reviewService.create(
          { appointmentId: 1, rating: 5 },
          { id: 1, role: 'PATIENT' }
        )
      ).rejects.toThrow('Bạn chỉ có thể đánh giá lịch khám của mình');
    });

    it('should reject duplicate review', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'COMPLETED',
        patient: { userId: 1 },
        patientId: 1,
        doctorId: 2,
      });
      reviewRepo.findByAppointmentId.mockResolvedValue({ id: 1 });

      await expect(
        reviewService.create(
          { appointmentId: 1, rating: 5 },
          { id: 1, role: 'PATIENT' }
        )
      ).rejects.toThrow('Bạn đã đánh giá lịch khám này rồi');
    });

    it('should reject invalid rating', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'COMPLETED',
        patient: { userId: 1 },
        patientId: 1,
        doctorId: 2,
      });
      reviewRepo.findByAppointmentId.mockResolvedValue(null);

      await expect(
        reviewService.create(
          { appointmentId: 1, rating: 6 },
          { id: 1, role: 'PATIENT' }
        )
      ).rejects.toThrow('Đánh giá phải từ 1 đến 5 sao');
    });
  });
});
