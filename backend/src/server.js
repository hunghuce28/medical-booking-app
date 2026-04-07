require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// ROUTES
// =============================================
app.get('/', (req, res) => {
  res.json({
    message: '🏥 Medical Booking API is running!',
    version: '1.0.0',
    docs: '/api-docs',
  });
});

// TODO: Tuần 3+ sẽ thêm các routes
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/patients', require('./routes/patient.routes'));
// app.use('/api/doctors', require('./routes/doctor.routes'));
// app.use('/api/specialties', require('./routes/specialty.routes'));
// app.use('/api/appointments', require('./routes/appointment.routes'));
// app.use('/api/medical-records', require('./routes/medicalRecord.routes'));
// app.use('/api/reviews', require('./routes/review.routes'));
// app.use('/api/notifications', require('./routes/notification.routes'));
// app.use('/api/admin', require('./routes/admin.routes'));

// =============================================
// ERROR HANDLING
// =============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// =============================================
// START SERVER
// =============================================
app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
