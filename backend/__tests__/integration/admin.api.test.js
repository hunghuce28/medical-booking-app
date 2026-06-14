/**
 * Admin Flow — Integration Tests
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/index');
const prisma = require('../../src/utils/prisma');

async function cleanDatabase() {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.review.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.medicalRecord.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.timeSlot.deleteMany(),
    prisma.doctorSchedule.deleteMany(),
    prisma.doctor.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.specialty.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

describe('Admin Flow API Integration Tests', () => {
  let adminToken = '';
  let specialtyId = 0;
  let doctorId = 0;

  beforeAll(async () => {
    await cleanDatabase();

    // 1. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@hospital.vn',
        fullName: 'System Admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        phone: '0900000000',
      },
    });

    // 2. Login as Admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hospital.vn', password: 'admin123' });
    adminToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('Specialty Management', () => {
    it('should allow Admin to create a specialty', async () => {
      const res = await request(app)
        .post('/api/specialties')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pediatrics',
          description: 'Children medical care',
          icon: '👶',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Pediatrics');
      specialtyId = res.body.data.id;
    });

    it('should allow Admin to update a specialty', async () => {
      const res = await request(app)
        .put(`/api/specialties/${specialtyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated children medical care description',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated children medical care description');
    });

    it('should allow Admin to view list of specialties', async () => {
      const res = await request(app)
        .get('/api/specialties');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Doctor Management', () => {
    it('should allow Admin to create a doctor profile', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'admin_doc@hospital.vn',
          fullName: 'Dr. Admin Created',
          password: 'docpassword123',
          phone: '0901112222',
          specialtyId: specialtyId,
          degree: 'PhD',
          experienceYears: 15,
          consultationFee: 600000,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      doctorId = res.body.data.doctor.id;
    });

    it('should allow Admin to update doctor details', async () => {
      const res = await request(app)
        .put(`/api/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Dr. Admin Updated Name',
          isActive: false, // deactivate doctor
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should allow Admin to delete a doctor profile', async () => {
      const res = await request(app)
        .delete(`/api/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Specialty Deletion', () => {
    it('should allow Admin to delete a specialty', async () => {
      const res = await request(app)
        .delete(`/api/specialties/${specialtyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
