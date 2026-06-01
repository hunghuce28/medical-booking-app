/**
 * Trang chủ (Home Screen)
 * Hiển thị chuyên khoa, bác sĩ nổi bật, lịch khám sắp tới
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import useAuthStore from '../../stores/authStore';
import api, { getFullImageUrl } from '../../services/api';
import Colors from '../../constants/colors';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [specRes, docRes] = await Promise.all([
        api.get('/specialties'),
        api.get('/doctors?limit=5'),
      ]);
      setSpecialties(specRes.data || []);
      setDoctors(docRes.data || []);
    } catch (error) {
      console.log('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào 👋</Text>
            <Text style={styles.userName}>{user?.fullName || 'Bệnh nhân'}</Text>
          </View>
          <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Đặt lịch khám bệnh{'\n'}dễ dàng & nhanh chóng</Text>
            <Text style={styles.bannerSubtitle}>
              Chọn bác sĩ chuyên khoa phù hợp và đặt lịch chỉ trong vài bước đơn giản.
            </Text>
          </View>
          <View style={styles.bannerIconBox}>
            <Ionicons name="pulse" size={36} color={Colors.white} />
          </View>
        </View>

        {/* Chuyên khoa */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chuyên khoa y tế</Text>
            <TouchableOpacity onPress={() => router.push('/booking')}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={specialties}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtyList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.specialtyCard}
                onPress={() => router.push({ pathname: '/booking', params: { specialtyId: item.id } })}
              >
                <View style={styles.specialtyIconBox}>
                  {item.icon ? (
                    <Image
                      source={{ uri: getFullImageUrl(item.icon) }}
                      style={{ width: '100%', height: '100%', borderRadius: 12 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="medical-outline" size={24} color={Colors.primary} />
                  )}
                </View>
                <Text style={styles.specialtyName} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Bác sĩ nổi bật */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bác sĩ nổi bật</Text>
            <TouchableOpacity onPress={() => router.push('/booking')}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {doctors.map((doctor) => (
            <TouchableOpacity
              key={doctor.id}
              style={styles.doctorCard}
              onPress={() => router.push(`/doctor/${doctor.id}`)}
            >
              <View style={styles.doctorAvatar}>
                {doctor.user?.avatar ? (
                  <Image
                    source={{ uri: getFullImageUrl(doctor.user.avatar) }}
                    style={{ width: '100%', height: '100%', borderRadius: 16 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.doctorAvatarText}>
                    {doctor.user?.fullName?.charAt(0) || '?'}
                  </Text>
                )}
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.user?.fullName}</Text>
                <Text style={styles.doctorSpecialty}>
                  <Ionicons name="medical" size={12} color={Colors.primary} /> {doctor.specialty?.name}
                </Text>
                <View style={styles.doctorMeta}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={11} color={Colors.accent} />
                    <Text style={styles.doctorRating}> {doctor.rating?.toFixed(1) || '5.0'}</Text>
                  </View>
                  <Text style={styles.doctorExp}>{doctor.experienceYears || 0} năm KN</Text>
                </View>
              </View>
              <View style={styles.doctorFee}>
                <Text style={styles.feeLabel}>Phí khám</Text>
                <Text style={styles.feeAmount}>
                  {Number(doctor.consultationFee || 0).toLocaleString('vi-VN')}đ
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
    paddingVertical: 18,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  notifButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  banner: {
    marginHorizontal: 20,
    backgroundColor: '#2563EB',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  bannerContent: {
    flex: 1,
    zIndex: 2,
  },
  bannerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 26,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  bannerIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  specialtyList: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  specialtyCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginRight: 14,
    alignItems: 'center',
    width: 96,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  specialtyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  specialtyName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  doctorAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '750',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  doctorRating: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '700',
  },
  doctorExp: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  doctorFee: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  feeLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '500',
    marginBottom: 2,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
});
