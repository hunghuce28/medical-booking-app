const prisma = require('../utils/prisma');
const socket = require('../utils/socket');

class NotificationService {
  async getByUserId(userId, query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.notification.count({ where: { userId: parseInt(userId) } }),
      prisma.notification.count({ where: { userId: parseInt(userId), isRead: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  async markAsRead(id) {
    return await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId: parseInt(userId), isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Hàm tiện ích: tạo thông báo mới (gọi từ service khác)
   */
  static async createNotification({ userId, title, message, type = 'GENERAL', data = null }) {
    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        title,
        message,
        type,
        data,
      }
    });

    // Phát sự kiện realtime tới đúng client của user tương ứng
    socket.sendToUser(userId, 'notification', notification);

    return notification;
  }
}

module.exports = new NotificationService();
module.exports.createNotification = NotificationService.createNotification;

