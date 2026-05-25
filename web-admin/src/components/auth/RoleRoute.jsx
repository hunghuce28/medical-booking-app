import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

/**
 * Component bảo vệ Router theo vai trò (Role Guard)
 * @param {object} props - Children và allowedRoles
 */
const RoleRoute = ({ children, allowedRoles }) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    // Nếu người dùng không có vai trò hợp lệ, chuyển hướng an toàn về trang lịch khám
    return <Navigate to="/admin/appointments" replace />;
  }

  return children;
};

export default RoleRoute;
