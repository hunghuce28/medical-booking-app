/**
 * Permission-Based Access Control (RBAC)
 * Định nghĩa tất cả permissions và mapping với roles.
 * Thay vì kiểm tra if(role === 'ADMIN'), sử dụng requirePermission('doctor.create').
 */

const PERMISSIONS = {
  // ========================
  // Appointment Permissions
  // ========================
  'appointment.create': ['PATIENT'],
  'appointment.view_own': ['PATIENT'],
  'appointment.view_all': ['ADMIN', 'DOCTOR'],
  'appointment.confirm': ['DOCTOR', 'ADMIN'],
  'appointment.reject': ['DOCTOR', 'ADMIN'],
  'appointment.cancel': ['PATIENT', 'ADMIN'],
  'appointment.complete': ['DOCTOR'],
  'appointment.manage_status': ['ADMIN', 'DOCTOR', 'PATIENT'],
  'appointment.dashboard': ['ADMIN', 'DOCTOR'],

  // ========================
  // Medical Record Permissions
  // ========================
  'record.create': ['DOCTOR'],
  'record.read_own': ['PATIENT'],
  'record.read_assigned': ['DOCTOR'],
  'record.read_all': ['ADMIN'],
  'record.read': ['PATIENT', 'DOCTOR', 'ADMIN'],

  // ========================
  // Doctor Permissions
  // ========================
  'doctor.create': ['ADMIN'],
  'doctor.update': ['ADMIN'],
  'doctor.delete': ['ADMIN'],
  'doctor.view': ['PATIENT', 'DOCTOR', 'ADMIN'],
  'doctor.manage_schedule': ['DOCTOR', 'ADMIN'],

  // ========================
  // Patient Permissions
  // ========================
  'patient.view_own': ['PATIENT'],
  'patient.view_assigned': ['DOCTOR'],
  'patient.view_all': ['ADMIN', 'DOCTOR'],
  'patient.toggle_status': ['ADMIN'],
  'patient.update_profile': ['PATIENT'],

  // ========================
  // Specialty Permissions
  // ========================
  'specialty.manage': ['ADMIN'],
  'specialty.view': ['PATIENT', 'DOCTOR', 'ADMIN'],

  // ========================
  // Review Permissions
  // ========================
  'review.create': ['PATIENT'],
  'review.view': ['PATIENT', 'DOCTOR', 'ADMIN'],

  // ========================
  // Notification Permissions
  // ========================
  'notification.view_own': ['PATIENT', 'DOCTOR', 'ADMIN'],
  'notification.manage': ['PATIENT', 'DOCTOR', 'ADMIN'],

  // ========================
  // Upload Permissions
  // ========================
  'upload.file': ['PATIENT', 'DOCTOR', 'ADMIN'],

  // ========================
  // Admin Permissions
  // ========================
  'admin.dashboard': ['ADMIN'],
  'admin.manage_users': ['ADMIN'],

  // ========================
  // Audit Permissions
  // ========================
  'audit.view': ['ADMIN'],
};

module.exports = PERMISSIONS;
