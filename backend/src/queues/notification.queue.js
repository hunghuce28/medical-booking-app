/**
 * Notification Queue
 * Tách notification khỏi request chính bằng EventEmitter pattern.
 * Khi hệ thống mở rộng, có thể thay thế bằng BullMQ/RabbitMQ mà không
 * cần sửa code ở service layer (chỉ thay đổi implementation của queue).
 */

const EventEmitter = require('events');
const { createNotification } = require('../services/notification.service');

class NotificationQueue extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Tránh warning khi có nhiều listener

    // Worker xử lý notification
    this.on('send', async (payload) => {
      try {
        await createNotification(payload);
      } catch (error) {
        console.error('[NotificationQueue] Lỗi xử lý notification:', error.message);
        this.emit('error:notification', { payload, error });
      }
    });

    // Worker xử lý batch notifications
    this.on('sendBatch', async (payloads) => {
      for (const payload of payloads) {
        try {
          await createNotification(payload);
        } catch (error) {
          console.error('[NotificationQueue] Lỗi batch notification:', error.message);
        }
      }
    });

    console.log('[NotificationQueue] Khởi tạo thành công (EventEmitter mode)');
  }

  /**
   * Đẩy một notification vào queue
   * @param {Object} payload - { userId, title, message, type, data }
   */
  enqueue(payload) {
    // Sử dụng setImmediate để đảm bảo non-blocking
    setImmediate(() => this.emit('send', payload));
  }

  /**
   * Đẩy nhiều notifications vào queue
   * @param {Array} payloads - Mảng các notification payload
   */
  enqueueBatch(payloads) {
    setImmediate(() => this.emit('sendBatch', payloads));
  }
}

// Singleton
module.exports = new NotificationQueue();
