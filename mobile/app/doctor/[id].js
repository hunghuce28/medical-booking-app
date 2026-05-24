/**
 * Màn hình Chi tiết bác sĩ (Doctor Detail Screen)
 * Hiển thị thông tin cá nhân bác sĩ, học vị, kinh nghiệm, phí khám và nút đặt lịch
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Colors from '../../constants/colors';

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/doctors/${id}`);
        setDoctor(res.data);
      } catch (error) {
        console.log('Error fetching doctor details:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchDoctorDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Không tìm thấy bác sĩ</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Thông tin bác sĩ không tồn tại hoặc đã bị ẩn.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleBooking = () => {
    // Điều hướng sang tab booking và truyền tham số doctorId
    router.push({
      pathname: '/booking',
      params: { doctorId: doctor.id }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin bác sĩ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Doctor Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {doctor.user?.fullName?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={styles.doctorName}>{doctor.user?.fullName}</Text>
          <Text style={styles.doctorSpecialty}>
            Chuyên khoa: {doctor.specialty?.name}
          </Text>
          <Text style={styles.doctorDegree}>{doctor.degree || 'Bác sĩ chuyên khoa'}</Text>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="star" size={20} color={Colors.accent} />
              <Text style={styles.statValue}>{doctor.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="ribbon" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{doctor.experienceYears} năm</Text>
              <Text style={styles.statLabel}>Kinh nghiệm</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="people" size={20} color="#4ECDC4" />
              <Text style={styles.statValue}>{doctor.totalReviews || '0'}+</Text>
              <Text style={styles.statLabel}>Bệnh nhân</Text>
            </View>
          </View>
        </View>

        {/* Biography */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <Text style={styles.bioText}>
            {doctor.description ||
              `Bác sĩ ${doctor.user?.fullName} là một chuyên gia có nhiều năm kinh nghiệm trong lĩnh vực ${doctor.specialty?.name}. Bác sĩ luôn tận tâm, chu đáo và hết lòng vì sức khỏe của bệnh nhân.`}
          </Text>
        </View>

        {/* Pricing & Time Info */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Giá dịch vụ khám</Text>
              <Text style={styles.priceAmount}>
                {Number(doctor.consultationFee).toLocaleString('vi-VN')} đ
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Giá gốc</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Booking Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookingBtn} onPress={handleBooking}>
          <Ionicons name="calendar-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.bookingBtnText}>Đặt lịch khám ngay</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  doctorDegree: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 14,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  priceSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  badge: {
    backgroundColor: '#FFE3E3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bookingBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});
