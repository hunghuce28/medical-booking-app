import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Auth
import AdminLayout from '../components/layout/AdminLayout';
import PrivateRoute from '../components/auth/PrivateRoute';
import RoleRoute from '../components/auth/RoleRoute';

// Auth Pages
import Login from '../pages/auth/Login';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import DoctorManage from '../pages/admin/DoctorManage';
import SpecialtyManage from '../pages/admin/SpecialtyManage';
import AppointmentManage from '../pages/admin/AppointmentManage';
import PatientManage from '../pages/admin/PatientManage';

const AppRouter = () => {
  return (
    <Routes>
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Auth Route */}
      <Route path="/login" element={<Login />} />

      {/* Admin Routes — Bảo vệ bằng PrivateRoute */}
      <Route path="/admin" element={
        <PrivateRoute>
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        
        {/* Route Dashboard và Appointments: Cả ADMIN và DOCTOR đều được vào */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="appointments" element={<AppointmentManage />} />
        
        {/* Các Route Quản lý đặc quyền: Chỉ cho phép ADMIN truy cập */}
        <Route path="specialties" element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <SpecialtyManage />
          </RoleRoute>
        } />
        <Route path="doctors" element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <DoctorManage />
          </RoleRoute>
        } />
        <Route path="patients" element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <PatientManage />
          </RoleRoute>
        } />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;

