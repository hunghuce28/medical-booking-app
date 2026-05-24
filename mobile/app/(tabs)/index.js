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
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import Colors from '../../constants/colors';

export default function HomeScreen() {
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
            <Text style={styles.greeting}>Xin chào</Text>
            <Text style={styles.userName}>{user?.fullName || 'Bệnh nhân'}</Text>
          </View>
          <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Đặt lịch khám bệnh{'\n'}dễ dàng & nhanh chóng</Text>
            <Text style={styles.bannerSubtitle}>
              Chọn bác sĩ chuyên khoa phù hợp{'\n'}và đặt lịch chỉ trong vài bước
            </Text>
          </View>
          <Ionicons name="medical" size={48} color={Colors.white} style={{ opacity: 0.8, marginLeft: 8 }} />
        </View>

        {/* Chuyên khoa */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chuyên khoa</Text>
            <TouchableOpacity>
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
              <TouchableOpacity style={styles.specialtyCard}>
                <View style={[styles.specialtyIconBox]}>
                  <Ionicons name="medical-outline" size={24} color={Colors.primary} />
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
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {doctors.map((doctor) => (
            <TouchableOpacity key={doctor.id} style={styles.doctorCard}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorAvatarText}>
                  {doctor.user?.fullName?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.user?.fullName}</Text>
                <Text style={styles.doctorSpecialty}>
                  <Ionicons name="medical" size={12} color={Colors.textSecondary} /> {doctor.specialty?.name}
                </Text>
                <View style={styles.doctorMeta}>
                  <Text style={styles.doctorRating}><Ionicons name="star" size={12} color={Colors.accent} /> {doctor.rating?.toFixed(1)}</Text>
                  <Text style={styles.doctorExp}>{doctor.experienceYears} năm KN</Text>
                </View>
              </View>
              <View style={styles.doctorFee}>
                <Text style={styles.feeAmount}>
                  {Number(doctor.consultationFee).toLocaleString('vi-VN')}đ
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
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifIcon: {
    fontSize: 20,
  },
  banner: {
    marginHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    lineHeight: 26,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.white + 'CC',
    lineHeight: 20,
  },
  bannerEmoji: {
    fontSize: 64,
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
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
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  specialtyList: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  specialtyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginRight: 12,
    alignItems: 'center',
    width: 90,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  specialtyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialtyName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  doctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  doctorAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorRating: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500',
  },
  doctorExp: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  doctorFee: {
    alignItems: 'flex-end',
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
