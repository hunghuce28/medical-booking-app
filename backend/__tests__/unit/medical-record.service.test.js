/**
 * Medical Record Service — Unit Tests
 */

jest.mock('../../src/repositories/medical-record.repository');
jest.mock('../../src/repositories/appointment.repository');
jest.mock('../../src/services/audit.service');
jest.mock('../../src/utils/prisma', () => {
  return {
    $transaction: jest.fn((fn) => fn({
      medicalRecord: {
        create: jest.fn(),
      },
    })),
  };
});

const medicalRecordRepo = require('../../src/repositories/medical-record.repository');
const appointmentRepo = require('../../src/repositories/appointment.repository');
const auditService = require('../../src/services/audit.service');
const prisma = require('../../src/utils/prisma');

process.env.JWT_SECRET = 'test-secret-key';
const medicalRecordService = require('../../src/services/medical-record.service');

describe('MedicalRecordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auditService.log.mockResolvedValue(undefined);
  });

  describe('create', () => {
    const validData = {
      appointmentId: 1,
      diagnosis: 'Flu',
      notes: 'Take rest',
      prescriptions: [{ medicineName: 'Paracetamol', dosage: '2/day', frequency: 'Morning-Night' }],
      attachments: [{ fileName: 'report.pdf', fileUrl: 'url', fileType: 'pdf' }],
    };

    it('should successfully create medical record for valid appointment', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'CONFIRMED',
        doctor: { userId: 10 },
      });
      medicalRecordRepo.findByAppointmentId.mockResolvedValue(null);

      const txMock = {
        medicalRecord: {
          create: jest.fn().mockResolvedValue({
            id: 100,
            appointmentId: 1,
            diagnosis: 'Flu',
            prescriptions: [],
            attachments: [],
          }),
        },
      };
      prisma.$transaction.mockImplementationOnce(async (fn) => fn(txMock));

      const result = await medicalRecordService.create(validData, { id: 10, role: 'DOCTOR' });
      expect(result.id).toBe(100);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw error when appointment not found', async () => {
      appointmentRepo.findById.mockResolvedValue(null);
      await expect(medicalRecordService.create(validData)).rejects.toThrow('Không tìm thấy lịch khám');
    });

    it('should throw error when appointment is not CONFIRMED or COMPLETED', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'PENDING',
        doctor: { userId: 10 },
      });

      await expect(
        medicalRecordService.create(validData, { id: 10, role: 'DOCTOR' })
      ).rejects.toThrow('Chỉ có thể tạo kết quả khám cho lịch hẹn');
    });

    it('should throw error if doctor does not own the appointment', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'CONFIRMED',
        doctor: { userId: 999 }, // Assigned to doctor 999
      });

      await expect(
        medicalRecordService.create(validData, { id: 10, role: 'DOCTOR' }) // Trying to create as doctor 10
      ).rejects.toThrow('Bạn chỉ có thể tạo kết quả khám cho lịch hẹn của mình');
    });

    it('should throw error if medical record already exists', async () => {
      appointmentRepo.findById.mockResolvedValue({
        id: 1,
        status: 'CONFIRMED',
        doctor: { userId: 10 },
      });
      medicalRecordRepo.findByAppointmentId.mockResolvedValue({ id: 100 });

      await expect(
        medicalRecordService.create(validData, { id: 10, role: 'DOCTOR' })
      ).rejects.toThrow('Lịch khám này đã có kết quả rồi');
    });
  });

  describe('getByAppointmentId', () => {
    const mockRecord = {
      id: 100,
      appointmentId: 1,
      appointment: {
        patient: { user: { id: 5 } },
        doctor: { user: { id: 10 } },
      },
    };

    it('should allow patient of the appointment to view', async () => {
      medicalRecordRepo.findByAppointmentId.mockResolvedValue(mockRecord);
      const result = await medicalRecordService.getByAppointmentId(1, { id: 5, role: 'PATIENT' });
      expect(result).toBe(mockRecord);
    });

    it('should allow doctor of the appointment to view', async () => {
      medicalRecordRepo.findByAppointmentId.mockResolvedValue(mockRecord);
      const result = await medicalRecordService.getByAppointmentId(1, { id: 10, role: 'DOCTOR' });
      expect(result).toBe(mockRecord);
    });

    it('should allow admin to view', async () => {
      medicalRecordRepo.findByAppointmentId.mockResolvedValue(mockRecord);
      const result = await medicalRecordService.getByAppointmentId(1, { id: 999, role: 'ADMIN' });
      expect(result).toBe(mockRecord);
    });

    it('should deny access to unrelated user', async () => {
      medicalRecordRepo.findByAppointmentId.mockResolvedValue(mockRecord);
      await expect(
        medicalRecordService.getByAppointmentId(1, { id: 11, role: 'PATIENT' })
      ).rejects.toThrow('Bạn không có quyền xem kết quả khám này');
    });

    it('should throw when medical record not found', async () => {
      medicalRecordRepo.findByAppointmentId.mockResolvedValue(null);
      await expect(
        medicalRecordService.getByAppointmentId(1, { id: 5, role: 'PATIENT' })
      ).rejects.toThrow('Chưa có kết quả khám cho lịch hẹn này');
    });
  });
});
