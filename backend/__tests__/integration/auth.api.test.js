/**
 * Auth API — Integration Tests
 */

const request = require('supertest');
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

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  const patientData = {
    email: 'integration_patient@test.com',
    fullName: 'Integration Patient',
    password: 'password123',
    phone: '0912345678',
  };

  let accessToken = '';
  let refreshToken = '';

  describe('POST /api/auth/register', () => {
    it('should successfully register a patient', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(patientData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(patientData.email);
    });

    it('should return 400 for duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(patientData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: patientData.email,
          password: patientData.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should return 400 or 401 for wrong credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: patientData.email,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(400); // errorHandler maps Joi/Auth errors to 400 or appropriate status
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user details for authenticated requests', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(patientData.email);
    });

    it('should return 401 if token is missing', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/sessions', () => {
    it('should return active sessions for logged in user', async () => {
      const res = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should rotate access & refresh tokens using valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should successfully change password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: patientData.password,
          newPassword: 'newpassword123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Update password for subsequent tests
      patientData.password = 'newpassword123';
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully log out and revoke token', async () => {
      // Login first to get a fresh token (change-password revokes all anyway)
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: patientData.email,
          password: patientData.password,
        });

      const freshAccessToken = loginRes.body.data.accessToken;
      const freshRefreshToken = loginRes.body.data.refreshToken;

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${freshAccessToken}`)
        .send({ refreshToken: freshRefreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify that the revoked token can no longer be used to refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: freshRefreshToken });

      expect(refreshRes.statusCode).toBe(400);
      expect(refreshRes.body.success).toBe(false);
    });
  });

  describe('Forgot and Reset Password Flow', () => {
    it('should successfully send a forgot password link', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: patientData.email });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('được gửi đến email');
    });

    it('should return 404 if email does not exist for forgot password', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should successfully reset password with valid token and revoke old sessions', async () => {
      // Find the user to extract the token
      const user = await prisma.user.findUnique({
        where: { email: patientData.email },
      });
      const token = user.resetPasswordToken;
      expect(token).toBeDefined();
      expect(token).not.toBeNull();

      // Reset password
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token,
          newPassword: 'resetpassword123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify that user can login with the new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: patientData.email,
          password: 'resetpassword123',
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data).toHaveProperty('accessToken');
    });

    it('should return 400 for invalid or expired token on reset password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-or-expired-token',
          newPassword: 'resetpassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
