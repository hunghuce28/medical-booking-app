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
        {/* Doctor Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {doctor.user?.fullName?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={styles.doctorName}>{doctor.user?.fullName}</Text>
          
          <View style={styles.specialtyTag}>
            <Ionicons name="medical" size={14} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.doctorSpecialty}>{doctor.specialty?.name}</Text>
          </View>

          <Text style={styles.doctorDegree}>{doctor.degree || 'Bác sĩ chuyên khoa y tế'}</Text>
          
          {/* Stats Section */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconBox}>
                <Ionicons name="star" size={18} color={Colors.accent} />
              </View>
              <Text style={styles.statValue}>{doctor.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.statIconBox}>
                <Ionicons name="ribbon-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{doctor.experienceYears} năm</Text>
              <Text style={styles.statLabel}>Kinh nghiệm</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.statIconBox}>
                <Ionicons name="people-outline" size={18} color="#0D9488" />
              </View>
              <Text style={styles.statValue}>{doctor.totalReviews || '0'}+</Text>
              <Text style={styles.statLabel}>Bệnh nhân</Text>
            </View>
          </View>
        </View>

        {/* Biography */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍⚕️ Giới thiệu bác sĩ</Text>
          <Text style={styles.bioText}>
            {doctor.description ||
              `Bác sĩ ${doctor.user?.fullName} là một chuyên gia uy tín với nhiều năm kinh nghiệm thực tiễn và nghiên cứu chuyên sâu trong lĩnh vực ${doctor.specialty?.name}. Bác sĩ luôn tâm niệm đặt y đức lên hàng đầu, hết lòng chăm sóc chu đáo cho sức khỏe của bệnh nhân.`}
          </Text>
        </View>

        {/* Pricing Info */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Giá dịch vụ khám</Text>
              <Text style={styles.priceAmount}>
                {Number(doctor.consultationFee).toLocaleString('vi-VN')} đ
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Giá niêm yết</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Booking Button Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookingBtn} onPress={handleBooking}>
          <Ionicons name="calendar-outline" size={22} color={Colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.bookingBtnText}>Đặt lịch hẹn ngay</Text>
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
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
    paddingBottom: 110,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  doctorDegree: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textTertiary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
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
    fontWeight: '500',
    lineHeight: 22,
  },
  priceSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
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
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  badge: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bookingBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
