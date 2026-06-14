/**
 * Doctor Service — Unit Tests
 */

jest.mock('../../src/repositories/doctor.repository');
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/schedule.repository');
jest.mock('../../src/repositories/timeslot.repository');
jest.mock('../../src/services/audit.service');
jest.mock('../../src/utils/prisma', () => {
  return {
    $transaction: jest.fn((fn) => fn({
      user: {
        create: jest.fn(),
        update: jest.fn(),
      },
      doctor: {
        create: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});

const doctorRepo = require('../../src/repositories/doctor.repository');
const userRepo = require('../../src/repositories/user.repository');
const scheduleRepo = require('../../src/repositories/schedule.repository');
const timeSlotRepo = require('../../src/repositories/timeslot.repository');
const auditService = require('../../src/services/audit.service');
const prisma = require('../../src/utils/prisma');

process.env.JWT_SECRET = 'test-secret-key';
const doctorService = require('../../src/services/doctor.service');

describe('DoctorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auditService.log.mockResolvedValue(undefined);
  });

  describe('getAllDoctors', () => {
    it('should query without pagination when page is missing and limit is provided', async () => {
      doctorRepo.findAllWithUser.mockResolvedValue([{ id: 1 }]);
      const result = await doctorService.getAllDoctors({ specialtyId: '1', limit: '5' });
      expect(doctorRepo.findAllWithUser).toHaveBeenCalledWith({ specialtyId: 1 }, { take: 5 });
      expect(result).toHaveLength(1);
    });

    it('should query with pagination when page and limit are provided', async () => {
      doctorRepo.findManyWithCount.mockResolvedValue({
        data: [{ id: 1 }],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await doctorService.getAllDoctors({ specialtyId: '1', limit: '10', page: '1' });
      expect(doctorRepo.findManyWithCount).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('should filter by search query using case-insensitive contains', async () => {
      doctorRepo.findManyWithCount.mockResolvedValue({
        data: [{ id: 1 }],
        total: 1,
        page: 1,
        limit: 10,
      });

      await doctorService.getAllDoctors({ search: 'John', limit: '10', page: '1' });
      expect(doctorRepo.findManyWithCount).toHaveBeenCalledWith(
        {
          user: {
            fullName: { contains: 'John', mode: 'insensitive' },
          },
        },
        expect.any(Object)
      );
    });
  });

  describe('getDoctorById', () => {
    it('should return doctor when found', async () => {
      doctorRepo.findByIdWithDetails.mockResolvedValue({ id: 1 });
      const result = await doctorService.getDoctorById(1);
      expect(result).toEqual({ id: 1 });
    });

    it('should throw error when doctor not found', async () => {
      doctorRepo.findByIdWithDetails.mockResolvedValue(null);
      await expect(doctorService.getDoctorById(999)).rejects.toThrow('Không tìm thấy bác sĩ');
    });
  });

  describe('createDoctor', () => {
    it('should successfully create doctor when email is not registered', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      const txMock = {
        user: {
          create: jest.fn().mockResolvedValue({ id: 10, email: 'doc@test.com', fullName: 'Doc', passwordHash: 'hashed' }),
        },
        doctor: {
          create: jest.fn().mockResolvedValue({ id: 1, userId: 10, specialtyId: 2 }),
        },
      };
      prisma.$transaction.mockImplementationOnce(async (fn) => fn(txMock));

      const result = await doctorService.createDoctor({
        email: 'doc@test.com',
        fullName: 'Doc',
        password: 'password123',
        phone: '123456789',
        specialtyId: '2',
      });

      expect(result.user.email).toBe('doc@test.com');
      expect(result.doctor.specialtyId).toBe(2);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw error when email is already registered', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 10, email: 'doc@test.com' });
      await expect(doctorService.createDoctor({ email: 'doc@test.com' })).rejects.toThrow('Email đã được sử dụng!');
    });
  });

  describe('updateDoctor', () => {
    it('should successfully update user and doctor attributes', async () => {
      doctorRepo.findById.mockResolvedValue({ id: 1, userId: 10, specialtyId: 1 });

      const txMock = {
        user: {
          update: jest.fn().mockResolvedValue({ id: 10 }),
        },
        doctor: {
          update: jest.fn().mockResolvedValue({ id: 1, specialtyId: 2, isActive: true }),
        },
      };
      prisma.$transaction.mockImplementationOnce(async (fn) => fn(txMock));

      const result = await doctorService.updateDoctor(1, {
        fullName: 'New Name',
        specialtyId: 2,
      });

      expect(result.specialtyId).toBe(2);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw error when doctor not found', async () => {
      doctorRepo.findById.mockResolvedValue(null);
      await expect(doctorService.updateDoctor(999, {})).rejects.toThrow('Không tìm thấy bác sĩ');
    });
  });

  describe('getAvailableSlots', () => {
    it('should return empty array when no schedule is set for the day', async () => {
      scheduleRepo.findByDoctorAndDay.mockResolvedValue(null);
      const result = await doctorService.getAvailableSlots(1, '2026-06-14'); // Sunday
      expect(result).toEqual([]);
    });

    it('should return generated slots with status', async () => {
      scheduleRepo.findByDoctorAndDay.mockResolvedValue({
        startTime: '08:00',
        endTime: '09:00',
        slotDurationMinutes: 30,
      });

      timeSlotRepo.upsertSlot.mockImplementation((docId, date, start, end) => {
        return Promise.resolve({
          id: 100,
          status: 'AVAILABLE',
        });
      });

      const result = await doctorService.getAvailableSlots(1, '2026-06-14');
      expect(result).toHaveLength(2);
      expect(result[0].startTime).toBe('08:00');
      expect(result[0].endTime).toBe('08:30');
      expect(result[1].startTime).toBe('08:30');
      expect(result[1].endTime).toBe('09:00');
    });
  });

  describe('updateSchedules', () => {
    it('should successfully update schedules in transaction', async () => {
      doctorRepo.findById.mockResolvedValue({ id: 1 });

      const txMock = {};
      prisma.$transaction.mockImplementationOnce(async (fn) => fn(txMock));

      scheduleRepo.upsertSchedule.mockResolvedValue({ id: 10, dayOfWeek: 'MONDAY' });
      scheduleRepo.deactivateExcept.mockResolvedValue();

      const result = await doctorService.updateSchedules(1, [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].dayOfWeek).toBe('MONDAY');
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('deleteDoctor', () => {
    it('should set isActive to false for both user and doctor', async () => {
      doctorRepo.findById.mockResolvedValue({ id: 1, userId: 10 });

      const txMock = {
        user: {
          update: jest.fn().mockResolvedValue({ id: 10, isActive: false }),
        },
        doctor: {
          update: jest.fn().mockResolvedValue({ id: 1, isActive: false }),
        },
      };
      prisma.$transaction.mockImplementationOnce(async (fn) => fn(txMock));

      const result = await doctorService.deleteDoctor(1);
      expect(result.isActive).toBe(false);
      expect(auditService.log).toHaveBeenCalled();
    });
  });
});
