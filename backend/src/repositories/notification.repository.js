/**
 * Notification Repository
 * Data access layer for Notification model
 */

const BaseRepository = require('./base.repository');

class NotificationRepository extends BaseRepository {
  constructor() {
    super('notification');
  }

  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      this.findMany(
        { userId: parseInt(userId) },
        { orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }
      ),
      this.count({ userId: parseInt(userId) }),
      this.count({ userId: parseInt(userId), isRead: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  async markAsRead(id) {
    return this.update(id, { isRead: true });
  }

  async markAllAsRead(userId) {
    return this.updateMany(
      { userId: parseInt(userId), isRead: false },
      { isRead: true }
    );
  }
}

module.exports = new NotificationRepository();
