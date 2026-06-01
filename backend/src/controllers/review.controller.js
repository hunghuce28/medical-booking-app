const reviewService = require('../services/review.service');
const { asyncHandler } = require('../utils/errorHandler');

class ReviewController {
  create = asyncHandler(async (req, res) => {
    const review = await reviewService.create(req.body, req.user);
    res.status(201).json({ success: true, message: 'Đánh giá thành công', data: review });
  });

  getByDoctorId = asyncHandler(async (req, res) => {
    const result = await reviewService.getByDoctorId(req.params.doctorId, req.query);
    res.status(200).json({ success: true, data: result });
  });
}

module.exports = new ReviewController();
