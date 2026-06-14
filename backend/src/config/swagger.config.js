/**
 * Swagger/OpenAPI Configuration
 * Generates API documentation at /api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Medical Appointment Booking API',
      version: '1.0.0',
      description: 'Hệ thống đặt lịch khám bệnh trực tuyến — API Documentation.\n\nBao gồm các phân hệ: Xác thực, Quản lý bác sĩ, Đặt lịch khám, Hồ sơ bệnh án, Đánh giá, Thông báo.',
      contact: {
        name: 'Nhóm 1 — 67CS1',
        email: 'admin@medicalbooking.vn',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập Access Token (không cần tiền tố "Bearer")',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Xác thực và quản lý phiên đăng nhập' },
      { name: 'Doctors', description: 'Quản lý bác sĩ và lịch làm việc' },
      { name: 'Specialties', description: 'Quản lý chuyên khoa y tế' },
      { name: 'Appointments', description: 'Đặt lịch và quản lý lịch khám' },
      { name: 'Patients', description: 'Quản lý hồ sơ bệnh nhân' },
      { name: 'Medical Records', description: 'Hồ sơ bệnh án điện tử' },
      { name: 'Reviews', description: 'Đánh giá bác sĩ' },
      { name: 'Notifications', description: 'Thông báo hệ thống' },
      { name: 'Upload', description: 'Tải file lên hệ thống' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
