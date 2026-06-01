const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken } = require('../utils/auth');
const { validate, createReviewSchema } = require('../validations');

// [POST] /api/reviews — Bệnh nhân đánh giá sau khám
router.post('/', verifyToken, validate(createReviewSchema), reviewController.create);

// [GET] /api/reviews/doctor/:doctorId — Xem đánh giá của bác sĩ
router.get('/doctor/:doctorId', reviewController.getByDoctorId);

module.exports = router;
