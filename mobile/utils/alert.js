/**
 * Cross-platform Alert Utility
 * Alert.alert() không hoạt động trên Web → dùng window.alert/confirm thay thế
 */

import { Platform, Alert } from 'react-native';

/**
 * Hiển thị thông báo đơn giản (OK only)
 * @param {string} title
 * @param {string} message
 */
export function showAlert(title, message) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Hiển thị hộp thoại xác nhận (OK / Cancel)
 * @param {string} title
 * @param {string} message
 * @param {Function} onConfirm - callback khi bấm OK/Xác nhận
 * @param {string} confirmText - text cho nút xác nhận (mặc định 'OK')
 * @param {string} cancelText  - text cho nút hủy    (mặc định 'Hủy')
 */
export function showConfirm(title, message, onConfirm, confirmText = 'OK', cancelText = 'Hủy') {
  if (Platform.OS === 'web') {
    const ok = window.confirm(message ? `${title}\n\n${message}` : title);
    if (ok) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
