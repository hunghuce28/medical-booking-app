/**
 * Notification Service — Refactored with Repository Pattern
 */

const notificationRepo = require('../repositories/notification.repository');
const socket = require('../utils/socket');

class NotificationService {
  async getByUserId(userId, query = {}) {
    return notificationRepo.findByUserId(userId, query);
  }

  async markAsRead(id, userId) {
    const notification = await notificationRepo.findById(id);
    if (!notification) throw new Error('Không tìm thấy thông báo');
    if (notification.userId !== parseInt(userId))
      throw new Error('Bạn không có quyền thao tác trên thông báo này');
    return notificationRepo.markAsRead(id);
  }

  async markAllAsRead(userId) {
    return notificationRepo.markAllAsRead(userId);
  }

  /**
   * Hàm tiện ích: tạo thông báo mới (gọi từ service khác hoặc queue)
   */
  static async createNotification({
    userId,
    title,
    message,
    type = 'GENERAL',
    data = null,
  }) {
    const notification = await notificationRepo.create({
      userId: parseInt(userId),
      title,
      message,
      type,
      data,
    });

    // Phát sự kiện realtime tới đúng client
    socket.sendToUser(userId, 'notification', notification);

    return notification;
  }
}

module.exports = new NotificationService();
module.exports.createNotification = NotificationService.createNotification;
