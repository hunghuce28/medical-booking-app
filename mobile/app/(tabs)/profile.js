/**
 * Cá nhân (Profile)
 * Xem/sửa hồ sơ, đổi mật khẩu, thông tin ứng dụng
 */

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import Colors from '../../constants/colors';
import { showAlert, showConfirm } from '../../utils/alert';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();

  // Edit Profile Modal
  const [editModal, setEditModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Change Password Modal
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogout = async () => {
    showConfirm(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      async () => {
        await logout();
        router.replace('/(auth)/login');
      },
      'Đăng xuất'
    );
  };

  // ───── Load Profile ─────
  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await api.get('/patients/profile');
      setProfile(res.data);
      setEditData({
        fullName: res.data?.user?.fullName || '',
        phone: res.data?.user?.phone || '',
        gender: res.data?.gender || '',
        address: res.data?.address || '',
        bloodType: res.data?.bloodType || '',
        allergies: res.data?.allergies || '',
        insuranceNumber: res.data?.insuranceNumber || '',
        dateOfBirth: res.data?.dateOfBirth ? res.data.dateOfBirth.split('T')[0] : '',
      });
    } catch (e) {
      console.log('Error loading profile:', e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const openEditProfile = () => {
    loadProfile();
    setEditModal(true);
  };

  // ───── Save Profile ─────
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.put('/patients/profile', editData);
      // Cập nhật Zustand store để giao diện hiển thị đúng ngay lập tức
      setUser({ ...user, fullName: editData.fullName, phone: editData.phone });
      showAlert('Thành công', 'Đã cập nhật hồ sơ');
      setEditModal(false);
    } catch (e) {
      showAlert('Lỗi', e.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  // ───── Change Password ─────
  const handleChangePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = passwordData;

    if (!oldPassword || !newPassword) {
      return showAlert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu');
    }
    if (newPassword.length < 6) {
      return showAlert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    if (newPassword !== confirmPassword) {
      return showAlert('Lỗi', 'Mật khẩu xác nhận không khớp');
    }

    try {
      setChangingPassword(true);
      await api.put('/auth/change-password', { oldPassword, newPassword });
      showAlert('Thành công', 'Đã đổi mật khẩu');
      setPasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      showAlert('Lỗi', e.message || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  const menuItems = [
    { icon: 'person-outline', title: 'Thông tin cá nhân', subtitle: 'Cập nhật hồ sơ của bạn', onPress: openEditProfile },
    { icon: 'document-text-outline', title: 'Lịch sử bệnh án', subtitle: 'Xem kết quả khám trước đó', onPress: () => router.push('/(tabs)/history') },
    { icon: 'lock-closed-outline', title: 'Đổi mật khẩu', subtitle: 'Bảo mật tài khoản', onPress: () => setPasswordModal(true) },
    { icon: 'settings-outline', title: 'Cài đặt', subtitle: 'Ngôn ngữ, thông báo', onPress: () => showAlert('Cài đặt', 'Tính năng đang phát triển') },
    { icon: 'information-circle-outline', title: 'Về ứng dụng', subtitle: 'Phiên bản 1.0.0', onPress: () => showAlert('Medical Booking', 'Phiên bản 1.0.0\nỨng dụng đặt lịch khám bệnh\n© 2026') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.fullName || 'Người dùng'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'DOCTOR' ? 'Bác sĩ' : 'Bệnh nhân'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} activeOpacity={0.7} onPress={item.onPress}>
              <Ionicons name={item.icon} size={22} color={Colors.textSecondary} style={{marginRight: 14}} />
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} style={{marginRight: 8}} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ═══ Modal Sửa hồ sơ ═══ */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông tin cá nhân</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingProfile ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Họ tên</Text>
                <TextInput
                  style={styles.input}
                  value={editData.fullName}
                  onChangeText={(v) => setEditData({ ...editData, fullName: v })}
                  placeholder="Nhập họ tên"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  value={editData.phone}
                  onChangeText={(v) => setEditData({ ...editData, phone: v })}
                  placeholder="0912345678"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Ngày sinh (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={editData.dateOfBirth}
                  onChangeText={(v) => setEditData({ ...editData, dateOfBirth: v })}
                  placeholder="1990-01-15"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.inputLabel}>Giới tính</Text>
                <View style={styles.genderContainer}>
                  {GENDER_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.genderBtn, editData.gender === opt.value && styles.genderBtnActive]}
                      onPress={() => setEditData({ ...editData, gender: opt.value })}
                    >
                      <Text style={[styles.genderText, editData.gender === opt.value && styles.genderTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  style={styles.input}
                  value={editData.address}
                  onChangeText={(v) => setEditData({ ...editData, address: v })}
                  placeholder="Nhập địa chỉ"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.inputLabel}>Nhóm máu</Text>
                <TextInput
                  style={styles.input}
                  value={editData.bloodType}
                  onChangeText={(v) => setEditData({ ...editData, bloodType: v })}
                  placeholder="A+, B+, O+, AB-..."
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.inputLabel}>Dị ứng</Text>
                <TextInput
                  style={styles.input}
                  value={editData.allergies}
                  onChangeText={(v) => setEditData({ ...editData, allergies: v })}
                  placeholder="Ghi chú dị ứng (nếu có)"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.inputLabel}>Số bảo hiểm y tế</Text>
                <TextInput
                  style={styles.input}
                  value={editData.insuranceNumber}
                  onChangeText={(v) => setEditData({ ...editData, insuranceNumber: v })}
                  placeholder="Nhập số BHYT (nếu có)"
                  placeholderTextColor={Colors.textTertiary}
                />

                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                  )}
                </TouchableOpacity>
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══ Modal Đổi mật khẩu ═══ */}
      <Modal visible={passwordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setPasswordModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Mật khẩu cũ</Text>
            <TextInput
              style={styles.input}
              value={passwordData.oldPassword}
              onChangeText={(v) => setPasswordData({ ...passwordData, oldPassword: v })}
              placeholder="Nhập mật khẩu cũ"
              placeholderTextColor={Colors.textTertiary}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <TextInput
              style={styles.input}
              value={passwordData.newPassword}
              onChangeText={(v) => setPasswordData({ ...passwordData, newPassword: v })}
              placeholder="Ít nhất 6 ký tự"
              placeholderTextColor={Colors.textTertiary}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
            <TextInput
              style={styles.input}
              value={passwordData.confirmPassword}
              onChangeText={(v) => setPasswordData({ ...passwordData, confirmPassword: v })}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={Colors.textTertiary}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.saveBtn, changingPassword && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>Đổi mật khẩu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Profile Header
  profileHeader: {
    alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20,
    backgroundColor: Colors.white, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 3, borderColor: Colors.primary,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.primary },
  profileName: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
  roleBadge: { backgroundColor: Colors.primaryBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Menu
  menuContainer: {
    marginTop: 20, marginHorizontal: 20, backgroundColor: Colors.white, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  menuSubtitle: { fontSize: 13, color: Colors.textTertiary },
  menuArrow: { fontSize: 22, color: Colors.textTertiary, fontWeight: '300' },

  // Logout
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 20, marginHorizontal: 20, marginBottom: 40, paddingVertical: 16,
    backgroundColor: Colors.errorBg, borderRadius: 16, borderWidth: 1, borderColor: Colors.error + '30',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.error },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 22, color: Colors.textTertiary, padding: 4 },

  // Input
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: Colors.background, borderRadius: 12, padding: 14, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary,
  },

  // Gender
  genderContainer: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.border, alignItems: 'center',
  },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  genderText: { fontSize: 14, color: Colors.textSecondary },
  genderTextActive: { color: Colors.primary, fontWeight: '600' },

  // Save
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
