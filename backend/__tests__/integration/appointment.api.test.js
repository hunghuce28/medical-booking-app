/**
 * Appointment & Booking Flow — Integration Tests
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

describe('Appointment & Booking API Flow Integration Tests', () => {
  let adminToken = '';
  let patientToken = '';
  let doctorToken = '';

  let specialtyId = 0;
  let doctorId = 0;
  let doctorUserId = 0;
  let patientUserId = 0;
  let timeSlotId = 0;
  let appointmentId = 0;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const tomorrowDayName = dayNames[tomorrow.getDay()];

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

  describe('Flow Execution', () => {
    it('1. Admin should create a Specialty', async () => {
      const res = await request(app)
        .post('/api/specialties')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Cardiology',
          description: 'Heart health specialists',
          icon: '❤️',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      specialtyId = res.body.data.id;
    });

    it('2. Admin should create a Doctor', async () => {
      const doctorPayload = {
        email: 'doctor_jack@hospital.vn',
        fullName: 'Dr. Jack Heart',
        password: 'doctorpassword',
        phone: '0901234567',
        specialtyId: specialtyId,
        degree: 'MD',
        experienceYears: 10,
        consultationFee: 500000,
      };

      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(doctorPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      doctorId = res.body.data.doctor.id;
      doctorUserId = res.body.data.user.id;
    });

    it('3. Doctor should log in', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'doctor_jack@hospital.vn', password: 'doctorpassword' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      doctorToken = res.body.data.accessToken;
    });

    it('4. Doctor/Admin should update doctor schedules', async () => {
      const schedulePayload = [
        {
          dayOfWeek: tomorrowDayName,
          startTime: '09:00',
          endTime: '12:00',
          slotDurationMinutes: 30,
        },
      ];

      const res = await request(app)
        .put(`/api/doctors/${doctorId}/schedules`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ schedules: schedulePayload });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('5. Patient should register and log in', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'patient_mary@test.com',
          fullName: 'Mary Patient',
          password: 'patientpassword',
          phone: '0987654321',
        });
      expect(registerRes.statusCode).toBe(201);
      patientUserId = registerRes.body.data.user.id;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'patient_mary@test.com', password: 'patientpassword' });
      expect(loginRes.statusCode).toBe(200);
      patientToken = loginRes.body.data.accessToken;
    });

    it('6. Patient should query available slots for Doctor', async () => {
      const res = await request(app)
        .get(`/api/doctors/${doctorId}/available-slots`)
        .query({ date: tomorrowDateStr })
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      
      // Select the first slot
      timeSlotId = res.body.data[0].id;
    });

    it('7. Patient should book an Appointment', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctorId,
          timeSlotId: timeSlotId,
          appointmentDate: tomorrowDateStr,
          symptoms: 'Mild chest pain',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      appointmentId = res.body.data.id;
    });

    it('8. Doctor should confirm the Appointment', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'CONFIRMED' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('9. Doctor should complete the Appointment', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('10. Doctor should create a Medical Record', async () => {
      const recordPayload = {
        appointmentId: appointmentId,
        diagnosis: 'Mild hypertension',
        prescription: 'Take rest and reduce salt',
        notes: 'Follow up in 2 weeks if pain persists',
      };

      const res = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(recordPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('11. Patient should create a Review for the doctor', async () => {
      const reviewPayload = {
        appointmentId: appointmentId,
        rating: 5,
        comment: 'Very professional doctor, highly recommended.',
      };

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(reviewPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('12. Admin should view Dashboard Statistics including new appointment metrics', async () => {
      const res = await request(app)
        .get('/api/appointments/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('monthlyRevenue');
      expect(res.body.data).toHaveProperty('topDoctors');
      expect(res.body.data).toHaveProperty('cancellationRate');
    });
  });
});
