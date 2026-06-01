const notificationService = require('../services/notification.service');

class NotificationController {
  async getAll(req, res, next) {
    try {
      const userId = req.user.id; // Lấy từ JWT token
      const result = await notificationService.getByUserId(userId, req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await notificationService.markAsRead(req.params.id, req.user.id);
      res.status(200).json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await notificationService.markAllAsRead(userId);
      res.status(200).json({ success: true, message: `Đã đánh dấu ${result.count} thông báo đã đọc` });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
