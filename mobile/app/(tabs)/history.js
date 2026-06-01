/**
 * Lịch sử khám — Appointment History
 * Tab Sắp tới / Đã khám
 * Chi tiết lịch, hủy lịch, xem kết quả, đánh giá bác sĩ
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Colors from '../../constants/colors';
import { showAlert, showConfirm } from '../../utils/alert';

const STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', color: Colors.statusPending, bg: Colors.warningBg },
  CONFIRMED: { label: 'Đã xác nhận', color: Colors.statusConfirmed, bg: Colors.successBg },
  COMPLETED: { label: 'Đã khám xong', color: Colors.statusCompleted, bg: Colors.infoBg },
  CANCELLED: { label: 'Đã hủy', color: Colors.statusCancelled, bg: '#F3F4F6' },
  REJECTED: { label: 'Từ chối', color: Colors.statusRejected, bg: Colors.errorBg },
  NO_SHOW: { label: 'Không đến', color: Colors.statusNoShow, bg: '#F5F3FF' },
};

export default function HistoryScreen() {
  const [tab, setTab] = useState('upcoming'); // upcoming | past
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal chi tiết
  const [detailModal, setDetailModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);

  // Modal kết quả khám
  const [recordModal, setRecordModal] = useState(false);
  const [medicalRecord, setMedicalRecord] = useState(null);

  // Modal đánh giá
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const statusFilter = tab === 'upcoming'
        ? 'PENDING' // Sẽ gọi thêm CONFIRMED
        : undefined;

      // Lấy tất cả rồi filter phía client cho đơn giản
      const res = await api.get('/appointments/my?limit=50');
      const all = res.data?.appointments || [];

      if (tab === 'upcoming') {
        setAppointments(all.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status)));
      } else {
        setAppointments(all.filter(a => ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(a.status)));
      }
    } catch (e) {
      console.log('Error fetching appointments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [tab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, [tab]);

  // ───── Hủy lịch ─────
  const handleCancel = (apt) => {
    showConfirm(
      'Hủy lịch khám',
      'Bạn có chắc muốn hủy lịch khám này?',
      async () => {
        try {
          await api.patch(`/appointments/${apt.id}/status`, { status: 'CANCELLED' });
          showAlert('Thành công', 'Đã hủy lịch khám');
          setDetailModal(false);
          fetchAppointments();
        } catch (e) {
          showAlert('Lỗi', e.message || 'Không thể hủy lịch');
        }
      },
      'Hủy lịch'
    );
  };

  // ───── Xem kết quả khám ─────
  const handleViewRecord = async (appointmentId) => {
    try {
      const res = await api.get(`/medical-records/${appointmentId}`);
      setMedicalRecord(res.data);
      setRecordModal(true);
    } catch (e) {
      showAlert('Thông báo', 'Chưa có kết quả khám cho lịch hẹn này');
    }
  };

  // ───── Đánh giá ─────
  const openReview = (apt) => {
    setSelectedApt(apt);
    setRating(5);
    setComment('');
    setReviewModal(true);
  };

  const handleSubmitReview = async () => {
    try {
      setSubmitting(true);
      await api.post('/reviews', {
        appointmentId: selectedApt.id,
        patientId: selectedApt.patientId,
        doctorId: selectedApt.doctorId,
        rating,
        comment,
      });
      showAlert('Cảm ơn!', 'Đánh giá của bạn đã được ghi nhận');
      setReviewModal(false);
      fetchAppointments();
    } catch (e) {
      showAlert('Lỗi', e.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════
  // RENDER
  // ═══════════════════════════════════

  const renderAppointmentCard = (apt) => {
    const st = STATUS_MAP[apt.status] || STATUS_MAP.PENDING;
    const hasReview = !!apt.review;
    const hasRecord = apt.medicalRecord !== null;

    return (
      <TouchableOpacity
        key={apt.id}
        style={styles.aptCard}
        onPress={() => { setSelectedApt(apt); setDetailModal(true); }}
        activeOpacity={0.7}
      >
        <View style={styles.aptHeader}>
          <View style={styles.aptDocAvatar}>
            <Text style={styles.aptDocAvatarText}>{apt.doctor?.user?.fullName?.charAt(0) || '?'}</Text>
          </View>
          <View style={styles.aptDocInfo}>
            <Text style={styles.aptDocName}>{apt.doctor?.user?.fullName}</Text>
            <Text style={styles.aptSpecialty}>{apt.doctor?.specialty?.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        <View style={styles.aptDetails}>
          <View style={styles.aptDetailItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.aptDetailText}>{new Date(apt.appointmentDate).toLocaleDateString('vi-VN')}</Text>
          </View>
          <View style={styles.aptDetailItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.aptDetailText}>{apt.timeSlot?.startTime} - {apt.timeSlot?.endTime}</Text>
          </View>
        </View>

        {/* Action buttons for completed appointments */}
        {apt.status === 'COMPLETED' && (
          <View style={styles.aptActions}>
            <TouchableOpacity
              style={styles.aptActionBtn}
              onPress={() => handleViewRecord(apt.id)}
            >
              <Text style={styles.aptActionText}>Kết quả khám</Text>
            </TouchableOpacity>
            {!hasReview && (
              <TouchableOpacity
                style={[styles.aptActionBtn, styles.aptActionBtnPrimary]}
                onPress={() => openReview(apt)}
              >
                <Text style={[styles.aptActionText, { color: Colors.white }]}>Đánh giá</Text>
              </TouchableOpacity>
            )}
            {hasReview && (
              <View style={styles.reviewedBadge}>
                <Text style={styles.reviewedText}>Đã đánh giá</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Text style={styles.screenTitle}>Lịch sử khám</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'upcoming' && styles.tabBtnActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>Sắp tới</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'past' && styles.tabBtnActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Đã khám</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          {appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name={tab === 'upcoming' ? 'calendar-outline' : 'document-text-outline'} size={56} color={Colors.textSecondary} style={{marginBottom: 12}} />
              <Text style={styles.emptyText}>
                {tab === 'upcoming' ? 'Chưa có lịch khám sắp tới' : 'Chưa có lịch sử khám'}
              </Text>
            </View>
          ) : (
            appointments.map(renderAppointmentCard)
          )}
        </ScrollView>
      )}

      {/* ═══ Modal Chi tiết ═══ */}
      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết lịch khám</Text>
              <TouchableOpacity onPress={() => setDetailModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedApt && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Bác sĩ</Text>
                  <Text style={styles.modalValue}>{selectedApt.doctor?.user?.fullName}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Chuyên khoa</Text>
                  <Text style={styles.modalValue}>{selectedApt.doctor?.specialty?.name}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Ngày khám</Text>
                  <Text style={styles.modalValue}>{new Date(selectedApt.appointmentDate).toLocaleDateString('vi-VN')}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Giờ khám</Text>
                  <Text style={styles.modalValue}>{selectedApt.timeSlot?.startTime} - {selectedApt.timeSlot?.endTime}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Trạng thái</Text>
                  <Text style={[styles.modalValue, { color: STATUS_MAP[selectedApt.status]?.color }]}>
                    {STATUS_MAP[selectedApt.status]?.label}
                  </Text>
                </View>
                {selectedApt.symptoms && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Triệu chứng</Text>
                    <Text style={styles.modalValue}>{selectedApt.symptoms}</Text>
                  </View>
                )}

                {['PENDING', 'CONFIRMED'].includes(selectedApt.status) && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(selectedApt)}>
                    <Text style={styles.cancelBtnText}>Hủy lịch khám</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══ Modal Kết quả khám ═══ */}
      <Modal visible={recordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kết quả khám bệnh</Text>
              <TouchableOpacity onPress={() => setRecordModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {medicalRecord && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.recordSection}>
                  <Text style={styles.recordLabel}>Chẩn đoán</Text>
                  <Text style={styles.recordValue}>{medicalRecord.diagnosis}</Text>
                </View>
                <View style={styles.recordSection}>
                  <Text style={styles.recordLabel}>Đơn thuốc</Text>
                  <Text style={styles.recordValue}>{medicalRecord.prescription || 'Không có'}</Text>
                </View>
                <View style={styles.recordSection}>
                  <Text style={styles.recordLabel}>Ghi chú</Text>
                  <Text style={styles.recordValue}>{medicalRecord.notes || 'Không có'}</Text>
                </View>
                {medicalRecord.followUpDate && (
                  <View style={styles.recordSection}>
                    <Text style={styles.recordLabel}>Ngày tái khám</Text>
                    <Text style={styles.recordValue}>{new Date(medicalRecord.followUpDate).toLocaleDateString('vi-VN')}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══ Modal Đánh giá ═══ */}
      <Modal visible={reviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đánh giá bác sĩ</Text>
              <TouchableOpacity onPress={() => setReviewModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reviewDocName}>{selectedApt?.doctor?.user?.fullName}</Text>

            {/* Star Rating */}
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons name={star <= rating ? "star" : "star-outline"} size={40} color={star <= rating ? Colors.accent : Colors.border} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>
              {rating === 5 ? 'Tuyệt vời!' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Tốt' : rating === 2 ? 'Bình thường' : 'Kém'}
            </Text>

            <TextInput
              style={styles.reviewInput}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />

            <TouchableOpacity
              style={[styles.submitReviewBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmitReview}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitReviewText}>Gửi đánh giá</Text>
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
  screenTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: 20, paddingTop: 16 },

  // Tabs
  tabContainer: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16, marginBottom: 8,
    backgroundColor: Colors.borderLight, borderRadius: 12, padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.white, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textTertiary },
  tabTextActive: { color: Colors.primary },

  // List
  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  // Appointment Card
  aptCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.borderLight, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  aptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aptDocAvatar: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  aptDocAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  aptDocInfo: { flex: 1 },
  aptDocName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  aptSpecialty: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },

  aptDetails: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  aptDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aptDetailIcon: { fontSize: 14 },
  aptDetailText: { fontSize: 13, color: Colors.textSecondary },

  aptActions: { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12 },
  aptActionBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center',
  },
  aptActionBtnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  aptActionText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  reviewedBadge: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  reviewedText: { fontSize: 13, color: Colors.success, fontWeight: '500' },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 22, color: Colors.textTertiary, padding: 4 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  modalLabel: { fontSize: 14, color: Colors.textSecondary },
  modalValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', flex: 1, marginLeft: 12 },

  cancelBtn: {
    marginTop: 24, backgroundColor: Colors.errorBg, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.error + '30',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.error },

  // Medical Record
  recordSection: { marginBottom: 16 },
  recordLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  recordValue: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22, backgroundColor: Colors.background, padding: 12, borderRadius: 10 },

  // Review
  reviewDocName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center', marginBottom: 16 },
  ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  ratingLabel: { textAlign: 'center', fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  reviewInput: {
    backgroundColor: Colors.background, borderRadius: 12, padding: 14, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border, minHeight: 80, color: Colors.textPrimary, marginBottom: 16,
  },
  submitReviewBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitReviewText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
