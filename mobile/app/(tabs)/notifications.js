/**
 * Thông báo — Notifications
 * Danh sách thông báo, đánh dấu đã đọc, đọc tất cả
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Colors from '../../constants/colors';

const TYPE_ICONS = {
  APPOINTMENT_CREATED: 'calendar-outline',
  APPOINTMENT_CONFIRMED: 'checkmark-circle-outline',
  APPOINTMENT_REJECTED: 'close-circle-outline',
  APPOINTMENT_CANCELLED: 'close-circle-outline',
  APPOINTMENT_COMPLETED: 'star-outline',
  APPOINTMENT_REMINDER: 'alarm-outline',
  GENERAL: 'notifications-outline',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (e) {
      console.log('Error fetching notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.log('Error marking as read:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.log('Error marking all as read:', e);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHrs < 24) return `${diffHrs} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAllAsRead}>
            <Text style={styles.readAllText}>Đọc tất cả ({unreadCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={56} color={Colors.textSecondary} style={{marginBottom: 12}} />
              <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
              <Text style={styles.emptyDesc}>Các thông báo về lịch khám sẽ hiển thị tại đây</Text>
            </View>
          ) : (
            notifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.isRead && styles.notifCardUnread]}
                onPress={() => !notif.isRead && handleMarkAsRead(notif.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.notifIconContainer, !notif.isRead && styles.notifIconUnread]}>
                  <Ionicons name={TYPE_ICONS[notif.type] || 'notifications-outline'} size={24} color={notif.isRead ? Colors.textSecondary : Colors.primary} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleUnread]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    {!notif.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                  <Text style={styles.notifTime}>{formatTime(notif.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  screenTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  readAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.primaryBg, borderRadius: 8 },
  readAllText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  // Notification Card
  notifCard: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.borderLight,
  },
  notifCardUnread: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary + '20' },
  notifIconContainer: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  notifIconUnread: { backgroundColor: Colors.white },
  notifContent: { flex: 1 },
  notifHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, flex: 1 },
  notifTitleUnread: { fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 8 },
  notifMessage: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, color: Colors.textTertiary },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
