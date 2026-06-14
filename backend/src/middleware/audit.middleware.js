/**
 * Audit Middleware
 * Tự động ghi audit log cho các route nhạy cảm (tạo, sửa, xóa dữ liệu y tế).
 * Sử dụng: router.post('/', verifyToken, auditAction('Appointment', 'CREATE'), controller.create);
 */

const auditService = require('../services/audit.service');

/**
 * Middleware ghi audit log SAU KHI response thành công
 * @param {string} entityType - Tên entity (Appointment, MedicalRecord, etc.)
 * @param {string} action - CREATE | UPDATE | DELETE | STATUS_CHANGE
 */
function auditAction(entityType, action) {
  return (req, res, next) => {
    // Lưu lại phương thức json gốc
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Chỉ ghi audit khi request thành công (status < 400)
      if (res.statusCode < 400 && body?.success !== false) {
        const entityId = body?.data?.id || req.params?.id || null;

        auditService.log({
          userId: req.user?.id || null,
          action,
          entityType,
          entityId: entityId ? parseInt(entityId) : null,
          oldValue: action === 'UPDATE' || action === 'STATUS_CHANGE' ? req._auditOldValue : null,
          newValue: body?.data || req.body || null,
          req,
        }).catch((err) => console.error('[AuditMiddleware] Error:', err.message));
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Middleware lưu giá trị cũ vào req trước khi update
 * Sử dụng: router.patch('/:id', verifyToken, captureOldValue('appointment'), ...)
 */
function captureOldValue(modelName) {
  const prisma = require('../utils/prisma');

  return async (req, res, next) => {
    try {
      if (req.params?.id) {
        const record = await prisma[modelName].findUnique({
          where: { id: parseInt(req.params.id) },
        });
        req._auditOldValue = record;
      }
    } catch (error) {
      // Không block request nếu capture thất bại
      console.error('[CaptureOldValue] Error:', error.message);
    }
    next();
  };
}

module.exports = { auditAction, captureOldValue };
