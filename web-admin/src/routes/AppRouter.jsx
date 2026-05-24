import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Auth
import AdminLayout from '../components/layout/AdminLayout';
import PrivateRoute from '../components/auth/PrivateRoute';

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
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="specialties" element={<SpecialtyManage />} />
        <Route path="doctors" element={<DoctorManage />} />
        <Route path="patients" element={<PatientManage />} />
        <Route path="appointments" element={<AppointmentManage />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;
