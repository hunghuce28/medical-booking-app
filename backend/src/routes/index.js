const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const doctorRoutes = require('./doctor.routes');
const specialtyRoutes = require('./specialty.routes');
const appointmentRoutes = require('./appointment.routes');
const patientRoutes = require('./patient.routes');
const medicalRecordRoutes = require('./medical-record.routes');
const reviewRoutes = require('./review.routes');
const notificationRoutes = require('./notification.routes');
const uploadRoutes = require('./upload.routes');
const healthRoutes = require('./health.routes');

router.use('/auth', authRoutes);
router.use('/specialties', specialtyRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/patients', patientRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);
router.use('/', healthRoutes);

module.exports = router;

