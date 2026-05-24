/**
 * Đặt lịch khám — Multi-step Booking Flow
 * Step 1: Chọn chuyên khoa
 * Step 2: Chọn bác sĩ
 * Step 3: Chọn ngày
 * Step 4: Chọn khung giờ
 * Step 5: Nhập triệu chứng & xác nhận
 * Step 6: Thành công
 */

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, FlatList, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import Colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';

const STEPS = ['Chuyên khoa', 'Bác sĩ', 'Ngày khám', 'Giờ khám', 'Xác nhận', 'Hoàn tất'];

export default function BookingScreen() {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Selections
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState('');

  // ───── Step 1: Load chuyên khoa ─────
  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/specialties');
      setSpecialties(res.data || []);
    } catch (e) {
      console.log('Error loading specialties:', e);
    } finally {
      setLoading(false);
    }
  };

  // ───── Step 2: Load bác sĩ theo chuyên khoa ─────
  const loadDoctors = async (specId) => {
    try {
      setLoading(true);
      const res = await api.get(`/doctors?specialtyId=${specId}`);
      setDoctors(res.data || []);
    } catch (e) {
      console.log('Error loading doctors:', e);
    } finally {
      setLoading(false);
    }
  };

  // ───── Step 4: Load slot trống ─────
  const loadSlots = async (docId, dateStr) => {
    try {
      setLoading(true);
      const res = await api.get(`/doctors/${docId}/available-slots?date=${dateStr}`);
      setSlots(res.data || []);
    } catch (e) {
      console.log('Error loading slots:', e);
    } finally {
      setLoading(false);
    }
  };

  // ───── Submit ─────
  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.post('/appointments', {
        patientId: user?.patient?.id || user?.id,
        doctorId: selectedDoctor.id,
        timeSlotId: selectedSlot.id,
        appointmentDate: selectedDate,
        symptoms,
      });
      setStep(5); // → Thành công
    } catch (e) {
      showAlert('Lỗi', e.message || 'Không thể đặt lịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setStep(0);
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSymptoms('');
    setSlots([]);
    setDoctors([]);
  };

  const goBack = () => {
    if (step > 0 && step < 5) setStep(step - 1);
  };

  // ───── Generate 14 ngày tới ─────
  const getNext14Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
        dayNum: d.getDate(),
        month: d.getMonth() + 1,
      });
    }
    return days;
  };

  // ═══════════════════════════════════
  // RENDER STEPS
  // ═══════════════════════════════════

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.slice(0, 5).map((label, i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[styles.stepCircle, i <= step && styles.stepCircleActive, i < step && styles.stepCircleDone]}>
            <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>
              {i < step ? '✓' : i + 1}
            </Text>
          </View>
          {i < 4 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  // ───── Step 1: Chuyên khoa ─────
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Chọn chuyên khoa</Text>
      <Text style={styles.stepDesc}>Chọn chuyên khoa bạn muốn khám</Text>
      {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <View style={styles.specialtyGrid}>
          {specialties.map((spec) => (
            <TouchableOpacity
              key={spec.id}
              style={[styles.specCard, selectedSpecialty?.id === spec.id && styles.specCardActive]}
              onPress={() => {
                setSelectedSpecialty(spec);
                loadDoctors(spec.id);
                setStep(1);
              }}
            >
              <View style={[styles.specIcon, { backgroundColor: selectedSpecialty?.id === spec.id ? Colors.primary : Colors.primaryBg, width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="medical-outline" size={24} color={selectedSpecialty?.id === spec.id ? Colors.white : Colors.primary} />
              </View>
              <Text style={styles.specName} numberOfLines={2}>{spec.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // ───── Step 2: Bác sĩ ─────
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Chọn bác sĩ</Text>
      <Text style={styles.stepDesc}><Ionicons name="medical" size={14} color={Colors.textSecondary} /> {selectedSpecialty?.name}</Text>
      {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : (
        doctors.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={48} color={Colors.textSecondary} style={{marginBottom: 12}} />
            <Text style={styles.emptyText}>Không có bác sĩ nào trong chuyên khoa này</Text>
          </View>
        ) : (
          doctors.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={[styles.docCard, selectedDoctor?.id === doc.id && styles.docCardActive]}
              onPress={() => { setSelectedDoctor(doc); setStep(2); }}
            >
              <View style={styles.docAvatar}>
                <Text style={styles.docAvatarText}>{doc.user?.fullName?.charAt(0) || '?'}</Text>
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.user?.fullName}</Text>
                <Text style={styles.docDegree}>{doc.degree} • {doc.experienceYears} năm KN</Text>
                <View style={styles.docMeta}>
                  <Text style={styles.docRating}><Ionicons name="star" size={12} color={Colors.accent} /> {doc.rating?.toFixed(1)}</Text>
                  <Text style={styles.docFee}>{Number(doc.consultationFee).toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )
      )}
    </View>
  );

  // ───── Step 3: Ngày khám ─────
  const renderStep3 = () => {
    const days = getNext14Days();
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Chọn ngày khám</Text>
        <Text style={styles.stepDesc}>{selectedDoctor?.user?.fullName}</Text>
        <View style={styles.dateGrid}>
          {days.map((day) => (
            <TouchableOpacity
              key={day.dateStr}
              style={[styles.dateCard, selectedDate === day.dateStr && styles.dateCardActive]}
              onPress={() => {
                setSelectedDate(day.dateStr);
                setSelectedSlot(null);
                loadSlots(selectedDoctor.id, day.dateStr);
                setStep(3);
              }}
            >
              <Text style={[styles.dateDow, selectedDate === day.dateStr && styles.dateTextActive]}>{day.dayOfWeek}</Text>
              <Text style={[styles.dateNum, selectedDate === day.dateStr && styles.dateTextActive]}>{day.dayNum}</Text>
              <Text style={[styles.dateMonth, selectedDate === day.dateStr && styles.dateTextActive]}>T{day.month}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // ───── Step 4: Giờ khám ─────
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Chọn giờ khám</Text>
      <Text style={styles.stepDesc}>Ngày {selectedDate} • {selectedDoctor?.user?.fullName}</Text>
      {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : (
        slots.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} style={{marginBottom: 12}} />
            <Text style={styles.emptyText}>Bác sĩ không làm việc ngày này{'\n'}Vui lòng chọn ngày khác</Text>
          </View>
        ) : (
          <View style={styles.slotGrid}>
            {slots.map((slot) => {
              const isAvailable = slot.status === 'AVAILABLE';
              return (
                <TouchableOpacity
                  key={slot.id}
                  disabled={!isAvailable}
                  style={[
                    styles.slotCard,
                    !isAvailable && styles.slotCardDisabled,
                    selectedSlot?.id === slot.id && styles.slotCardActive,
                  ]}
                  onPress={() => { setSelectedSlot(slot); setStep(4); }}
                >
                  <Text style={[
                    styles.slotTime,
                    !isAvailable && styles.slotTimeDisabled,
                    selectedSlot?.id === slot.id && styles.slotTimeActive,
                  ]}>
                    {slot.startTime}
                  </Text>
                  <Text style={[styles.slotEndTime, !isAvailable && styles.slotTimeDisabled]}>
                    {isAvailable ? `→ ${slot.endTime}` : 'Đã đặt'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )
      )}
    </View>
  );

  // ───── Step 5: Xác nhận ─────
  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Xác nhận đặt lịch</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Chuyên khoa</Text>
          <Text style={styles.summaryValue}>{selectedSpecialty?.name}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Bác sĩ</Text>
          <Text style={styles.summaryValue}>{selectedDoctor?.user?.fullName}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ngày khám</Text>
          <Text style={styles.summaryValue}>{selectedDate}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Giờ khám</Text>
          <Text style={styles.summaryValue}>{selectedSlot?.startTime} - {selectedSlot?.endTime}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phí khám</Text>
          <Text style={[styles.summaryValue, { color: Colors.primary, fontWeight: '700' }]}>
            {Number(selectedDoctor?.consultationFee).toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </View>

      <Text style={styles.inputLabel}>Triệu chứng (không bắt buộc)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Mô tả triệu chứng của bạn..."
        placeholderTextColor={Colors.textTertiary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={symptoms}
        onChangeText={setSymptoms}
      />

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.submitBtnText}>Xác nhận đặt lịch</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // ───── Step 6: Thành công ─────
  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <Ionicons name="checkmark-circle" size={72} color={Colors.success} style={{marginBottom: 16}} />
      <Text style={styles.successTitle}>Đặt lịch thành công!</Text>
      <Text style={styles.successDesc}>
        Lịch khám của bạn đã được ghi nhận.{'\n'}
        Vui lòng chờ bác sĩ xác nhận.
      </Text>

      <View style={styles.successCard}>
        <Text style={styles.successCardRow}>{selectedSpecialty?.name}</Text>
        <Text style={styles.successCardRow}>{selectedDoctor?.user?.fullName}</Text>
        <Text style={styles.successCardRow}>{selectedDate}</Text>
        <Text style={styles.successCardRow}>{selectedSlot?.startTime} - {selectedSlot?.endTime}</Text>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={resetBooking}>
        <Text style={styles.submitBtnText}>Đặt lịch mới</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderStep1();
      case 1: return renderStep2();
      case 2: return renderStep3();
      case 3: return renderStep4();
      case 4: return renderStep5();
      case 5: return renderSuccess();
      default: return renderStep1();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {step > 0 && step < 5 ? (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Quay lại</Text>
          </TouchableOpacity>
        ) : <View />}
        <Text style={styles.headerTitle}>Đặt lịch khám</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Step Indicator */}
      {step < 5 && renderStepIndicator()}

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {renderCurrentStep()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  backBtn: { width: 80 },
  backBtnText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: Colors.primary },
  stepCircleDone: { backgroundColor: Colors.success },
  stepNum: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary },
  stepNumActive: { color: Colors.white },
  stepLine: { width: 24, height: 2, backgroundColor: Colors.borderLight, marginHorizontal: 2 },
  stepLineActive: { backgroundColor: Colors.success },

  // Step Content
  stepContent: { paddingHorizontal: 20, paddingTop: 8 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  stepDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },

  // Specialty Grid
  specialtyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  specCard: {
    width: '30%', backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.borderLight,
  },
  specCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  specIcon: { marginBottom: 8 },
  specName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },

  // Doctor Card
  docCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: Colors.borderLight,
  },
  docCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  docAvatar: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  docAvatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  docInfo: { flex: 1 },
  docName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  docDegree: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docRating: { fontSize: 13, color: Colors.accent, fontWeight: '500' },
  docFee: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Date Grid
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dateCard: {
    width: 70, backgroundColor: Colors.white, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.borderLight,
  },
  dateCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dateDow: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  dateNum: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginVertical: 2 },
  dateMonth: { fontSize: 11, color: Colors.textTertiary },
  dateTextActive: { color: Colors.white },

  // Slot Grid
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotCard: {
    width: '30%', backgroundColor: Colors.white, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.borderLight,
  },
  slotCardDisabled: { backgroundColor: Colors.borderLight, borderColor: Colors.border, opacity: 0.5 },
  slotCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  slotTime: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  slotTimeDisabled: { color: Colors.textTertiary },
  slotTimeActive: { color: Colors.primary },
  slotEndTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  // Summary
  summaryCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', flex: 1, marginLeft: 12 },
  summaryDivider: { height: 1, backgroundColor: Colors.borderLight },

  // Input
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  textInput: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 16, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border, minHeight: 100, color: Colors.textPrimary, marginBottom: 24,
  },

  // Submit
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginHorizontal: 0,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  // Success
  successContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 40, alignItems: 'center' },
  successEmoji: { fontSize: 72, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  successDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  successCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20, width: '100%',
    marginBottom: 32, borderWidth: 1, borderColor: Colors.borderLight,
  },
  successCardRow: { fontSize: 15, color: Colors.textPrimary, marginBottom: 8 },

  // Empty State
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
