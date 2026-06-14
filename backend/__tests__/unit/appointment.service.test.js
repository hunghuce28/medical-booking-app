/**
 * Appointment Service — Unit Tests
 * Kiểm thử logic đặt lịch, chuyển trạng thái, dashboard
 */

jest.mock('../../src/repositories/appointment.repository');
jest.mock('../../src/repositories/doctor.repository');
jest.mock('../../src/repositories/patient.repository');
jest.mock('../../src/repositories/timeslot.repository');
jest.mock('../../src/services/audit.service');
jest.mock('../../src/queues/notification.queue');
jest.mock('../../src/utils/prisma', () => {
  return {
    $transaction: jest.fn((fn) => fn({
      appointment: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      timeSlot: {
        update: jest.fn(),
      },
      $queryRaw: jest.fn(),
    })),
    specialty: { count: jest.fn().mockResolvedValue(5) },
    $queryRaw: jest.fn().mockResolvedValue([{ revenue: 0 }]),
  };
});

const appointmentRepo = require('../../src/repositories/appointment.repository');
const doctorRepo = require('../../src/repositories/doctor.repository');
const patientRepo = require('../../src/repositories/patient.repository');
const auditService = require('../../src/services/audit.service');
const notificationQueue = require('../../src/queues/notification.queue');

process.env.JWT_SECRET = 'test-secret-key';
const appointmentService = require('../../src/services/appointment.service');

describe('AppointmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auditService.log.mockResolvedValue(undefined);
    auditService.logStatusChange.mockResolvedValue(undefined);
    notificationQueue.enqueue.mockImplementation(() => {});
    notificationQueue.enqueueBatch.mockImplementation(() => {});
  });

  // ========================
  // GET ALL APPOINTMENTS
  // ========================
  describe('getAllAppointments', () => {
    it('should return paginated appointments', async () => {
      appointmentRepo.findManyWithCount.mockResolvedValue({
        data: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
        limit: 20,
      });

      const result = await appointmentService.getAllAppointments({});
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by doctor for DOCTOR role', async () => {
      doctorRepo.findByUserId.mockResolvedValue({ id: 10 });
      appointmentRepo.findManyWithCount.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await appointmentService.getAllAppointments(
        {},
        { id: 1, role: 'DOCTOR' }
      );

      expect(doctorRepo.findByUserId).toHaveBeenCalledWith(1);
    });
  });

  // ========================
  // UPDATE STATUS — State Machine
  // ========================
  describe('updateStatus', () => {
    it('should reject invalid state transitions', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'COMPLETED',
        patient: { userId: 1 },
        doctor: { userId: 2 },
        timeSlotId: 1,
      });

      await expect(
        appointmentService.updateStatus(1, 'PENDING')
      ).rejects.toThrow('Không thể chuyển từ trạng thái');
    });

    it('should reject patient from modifying others appointment', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'PENDING',
        patient: { userId: 999 },
        doctor: { userId: 2 },
        timeSlotId: 1,
      });

      await expect(
        appointmentService.updateStatus(1, 'CANCELLED', null, {
          id: 1,
          role: 'PATIENT',
        })
      ).rejects.toThrow('Bạn không có quyền chỉnh sửa');
    });

    it('should prevent patient from confirming appointment', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'PENDING',
        patient: { userId: 1 },
        doctor: { userId: 2 },
        timeSlotId: 1,
      });

      await expect(
        appointmentService.updateStatus(1, 'CONFIRMED', null, {
          id: 1,
          role: 'PATIENT',
        })
      ).rejects.toThrow('Bạn không có quyền cập nhật trạng thái này!');
    });

    it('should reject doctor from managing other doctor appointment', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'PENDING',
        patient: { userId: 3 },
        doctor: { userId: 999 },
        timeSlotId: 1,
      });

      await expect(
        appointmentService.updateStatus(1, 'CONFIRMED', null, {
          id: 2,
          role: 'DOCTOR',
        })
      ).rejects.toThrow('Bạn không có quyền thao tác trên lịch khám của bác sĩ khác');
    });
  });

  // ========================
  // GET PATIENT APPOINTMENTS
  // ========================
  describe('getPatientAppointments', () => {
    it('should return patient appointments', async () => {
      appointmentRepo.findByPatientId.mockResolvedValue({
        data: [{ id: 1 }],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await appointmentService.getPatientAppointments(1, {});
      expect(result.data).toHaveLength(1);
    });
  });
});
