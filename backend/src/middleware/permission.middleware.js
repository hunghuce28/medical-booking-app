/**
 * Permission Middleware
 * Kiểm tra quyền truy cập dựa trên Permission-Based Access Control.
 * Thay thế authorize('ADMIN', 'DOCTOR') bằng requirePermission('appointment.view_all').
 */

const PERMISSIONS = require('../config/permissions');

/**
 * Middleware kiểm tra permission
 * @param  {...string} requiredPermissions - Danh sách permissions cần có (tất cả đều phải thỏa mãn)
 */
function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực. Vui lòng đăng nhập.',
      });
    }

    const userRole = req.user.role;

    const missingPermissions = requiredPermissions.filter((perm) => {
      const allowedRoles = PERMISSIONS[perm];
      if (!allowedRoles) {
        console.warn(`[Permission] Permission "${perm}" chưa được định nghĩa trong config.`);
        return true; // Permission không tồn tại → không cho phép
      }
      return !allowedRoles.includes(userRole);
    });

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện thao tác này.`,
        requiredPermissions: missingPermissions,
      });
    }

    next();
  };
}

/**
 * Middleware kiểm tra ít nhất MỘT permission thỏa mãn (OR logic)
 * @param  {...string} permissions - Danh sách permissions (chỉ cần 1 trong số đó)
 */
function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực. Vui lòng đăng nhập.',
      });
    }

    const userRole = req.user.role;

    const hasAny = permissions.some((perm) => {
      const allowedRoles = PERMISSIONS[perm];
      return allowedRoles && allowedRoles.includes(userRole);
    });

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này.',
      });
    }

    next();
  };
}

module.exports = { requirePermission, requireAnyPermission };
