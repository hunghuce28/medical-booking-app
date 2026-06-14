/**
 * Notification Service — Refactored with Repository Pattern & Nodemailer Integration
 */

const nodemailer = require('nodemailer');
const notificationRepo = require('../repositories/notification.repository');
const socket = require('../utils/socket');
const prisma = require('../utils/prisma');

let transporter;
async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: port === '465',
      auth: {
        user,
        pass,
      },
    });
    console.log('[NotificationService] Nodemailer configured with custom SMTP.');
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('[NotificationService] Nodemailer fallback configured with Ethereal email account:', testAccount.user);
    } catch (err) {
      console.error('[NotificationService] Failed to create Ethereal test account, email fallback disabled:', err.message);
      transporter = {
        sendMail: async (options) => {
          console.log('[NotificationService Mock Mail] SMTP is offline. Email content:', options);
          return { messageId: 'mock-id' };
        }
      };
    }
  }
  return transporter;
}

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
   * Gửi email qua Nodemailer
   */
  async sendEmailNotification({ to, subject, html }) {
    try {
      const smtpTransporter = await getTransporter();
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Medical Booking" <noreply@medicalbooking.com>',
        to,
        subject,
        html,
      };

      const info = await smtpTransporter.sendMail(mailOptions);
      console.log(`[NotificationService] Email sent to ${to}. MessageId: ${info.messageId}`);
      
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[NotificationService] Ethereal Preview URL: ${previewUrl}`);
      }
      return info;
    } catch (error) {
      console.error('[NotificationService] Lỗi gửi email:', error.message);
    }
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

    // Gửi email notification song song
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (user && user.email) {
      const importantTypes = [
        'APPOINTMENT_CREATED',
        'APPOINTMENT_CONFIRMED',
        'APPOINTMENT_REJECTED',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_COMPLETED'
      ];
      if (importantTypes.includes(type)) {
        const subject = `[Medical Booking] ${title}`;
        const html = `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Medical Booking System</h2>
            <p>Xin chào <strong>${user.fullName}</strong>,</p>
            <p>Bạn có một thông báo mới về lịch khám:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4f46e5;">
              <strong style="font-size: 16px;">${title}</strong>
              <p style="margin: 5px 0 0 0; color: #4b5563;">${message}</p>
            </div>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">Vui lòng không trả lời email này. Đây là email tự động từ hệ thống.</p>
          </div>
        `;
        const serviceInstance = new NotificationService();
        serviceInstance.sendEmailNotification({ to: user.email, subject, html })
          .catch(err => console.error('[NotificationService] Background email error:', err.message));
      }
    }

    return notification;
  }
}

const notificationServiceInstance = new NotificationService();
module.exports = notificationServiceInstance;
module.exports.createNotification = NotificationService.createNotification;
