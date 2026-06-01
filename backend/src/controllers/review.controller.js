const reviewService = require('../services/review.service');

class ReviewController {
  async create(req, res, next) {
    try {
      const review = await reviewService.create(req.body, req.user);
      res.status(201).json({ success: true, message: 'Đánh giá thành công', data: review });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getByDoctorId(req, res, next) {
    try {
      const result = await reviewService.getByDoctorId(req.params.doctorId, req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();
