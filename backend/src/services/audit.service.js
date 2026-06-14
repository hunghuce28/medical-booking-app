/**
 * Audit Service
 * Ghi nhận mọi thao tác thay đổi dữ liệu nhạy cảm trong hệ thống y tế.
 * Đây là yêu cầu bắt buộc trong medical system để trả lời:
 *   Ai sửa? Lúc nào? Sửa trường nào? Giá trị cũ/mới là gì?
 */

const auditRepo = require('../repositories/audit.repository');

class AuditService {
  /**
   * Ghi một bản ghi audit log
   * @param {Object} params
   * @param {number} params.userId - ID người thực hiện
   * @param {string} params.action - CREATE | UPDATE | DELETE | STATUS_CHANGE | LOGIN | LOGOUT
   * @param {string} params.entityType - Tên entity (Appointment, MedicalRecord, etc.)
   * @param {number} params.entityId - ID của entity bị ảnh hưởng
   * @param {Object} params.oldValue - Giá trị trước khi thay đổi
   * @param {Object} params.newValue - Giá trị sau khi thay đổi
   * @param {Object} params.req - Express request object (để lấy IP, User-Agent)
   */
  async log({ userId, action, entityType, entityId, oldValue = null, newValue = null, req = null }) {
    try {
      return await auditRepo.create({
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ipAddress: req?.ip || req?.connection?.remoteAddress || null,
        userAgent: req?.get?.('User-Agent') || null,
      });
    } catch (error) {
      // Audit logging không được làm fail request chính
      console.error('[AuditService] Lỗi ghi audit log:', error.message);
    }
  }

  /**
   * Ghi log khi trạng thái thay đổi (đặc biệt cho Appointment)
   */
  async logStatusChange({ userId, entityType, entityId, oldStatus, newStatus, req }) {
    return this.log({
      userId,
      action: 'STATUS_CHANGE',
      entityType,
      entityId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
      req,
    });
  }

  /**
   * Truy vấn audit logs theo entity
   */
  async getByEntity(entityType, entityId, options = {}) {
    return auditRepo.findByEntity(entityType, entityId, options);
  }

  /**
   * Truy vấn audit logs theo user
   */
  async getByUser(userId, options = {}) {
    return auditRepo.findByUserId(userId, options);
  }
}

module.exports = new AuditService();
