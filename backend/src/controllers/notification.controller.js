const notificationService = require('../services/notification.service');
const { asyncHandler } = require('../utils/errorHandler');

class NotificationController {
  getAll = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await notificationService.getByUserId(userId, req.query);
    res.status(200).json({ success: true, data: result });
  });

  markAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Đã đánh dấu đã đọc' });
  });

  markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);
    res.status(200).json({ success: true, message: `Đã đánh dấu ${result.count} thông báo đã đọc` });
  });
}

module.exports = new NotificationController();
