import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { createApiCall } from '../../utils/api-helpers';
import { ListSkeleton, BookingCardSkeleton } from '../../components/Skeleton';
import { ErrorView, EmptyState } from '../../components/ErrorBoundary';
import {
  getButtonAccessibility,
  getHeaderAccessibility,
  getStatusBadgeAccessibility,
  getLiveRegion,
} from '../../utils/accessibility';
import { COLORS, SIZES } from '../../constants/theme';
import { formatDate, formatTime, formatPrice, formatStatus, getStatusColor } from '@3on/shared';

// Create wrapped API call with error handling
const fetchBookingsWithRetry = createApiCall(
  () => api.get('/bookings'),
  { context: 'Fetching bookings', retries: 3 }
);

const getStatusColorLocal = (status) => {
  const colors = {
    pending: '#FFA726',
    confirmed: '#42A5F5',
    in_progress: '#AB47BC',
    on_the_way: '#29B6F6',
    completed: '#66BB6A',
    cancelled: '#EF5350',
    no_show: '#78909C',
  };
  return colors[status] || '#999';
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const isRTL = I18nManager.isRTL;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = useCallback(async () => {
    setError(null);
    
    const result = await fetchBookingsWithRetry();
    
    if (result.success) {
      setBookings(result.data.bookings || []);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  // Render loading skeleton
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonTitle, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
            <View style={[styles.skeletonSubtitle, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          </View>
        </View>
        <View style={styles.content}>
          <ListSkeleton count={4} renderItem={() => <BookingCardSkeleton />} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
      accessibilityLabel="Bookings list"
    >
      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, isRTL && styles.textRTL]}
          {...getHeaderAccessibility('My Bookings')}
        >
          My Bookings
        </Text>
        <Text
          style={[styles.headerSubtitle, isRTL && styles.textRTL]}
          accessibilityLabel="Track your car wash appointments"
        >
          Track your car wash appointments
        </Text>
      </View>

      <View style={styles.content} {...getLiveRegion('polite')}>
        {error ? (
          <ErrorView
            error={error}
            onRetry={fetchBookings}
            title="Couldn't load bookings"
            message={error.message}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No bookings yet"
            message="You haven't made any bookings yet. Book your first car wash service today!"
            actionLabel="Book Your First Service"
            onAction={() => router.push('/(tabs)/services')}
          />
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity
              key={booking._id}
              style={styles.bookingCard}
              onPress={() => router.push(`/booking/${booking._id}`)}
              {...getButtonAccessibility(
                `${booking.serviceId?.name}, ${formatStatus(booking.status)}, ${formatDate(booking.scheduledDate)}`,
                'View booking details'
              )}
            >
              <View style={[styles.cardHeader, isRTL && styles.cardHeaderRTL]}>
                <Text
                  style={styles.bookingNumber}
                  accessibilityLabel={`Booking number ${booking.bookingNumber}`}
                >
                  {booking.bookingNumber}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColorLocal(booking.status) },
                  ]}
                  {...getStatusBadgeAccessibility(booking.status, formatStatus(booking.status))}
                >
                  <Text style={styles.statusText}>
                    {formatStatus(booking.status)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.serviceName, isRTL && styles.textRTL]}>
                {booking.serviceId?.name}
              </Text>

              <View style={styles.detailsContainer}>
                <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                  <Ionicons name="calendar" size={16} color={COLORS.textSecondary} />
                  <Text style={[styles.detailText, isRTL && styles.detailTextRTL]}>
                    {formatDate(booking.scheduledDate)}
                  </Text>
                </View>

                <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                  <Ionicons name="time" size={16} color={COLORS.textSecondary} />
                  <Text style={[styles.detailText, isRTL && styles.detailTextRTL]}>
                    {formatTime(booking.scheduledTime)}
                  </Text>
                </View>

                <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                  <Ionicons name="car" size={16} color={COLORS.textSecondary} />
                  <Text style={[styles.detailText, isRTL && styles.detailTextRTL]}>
                    {booking.vehicleId?.make} {booking.vehicleId?.model}
                  </Text>
                </View>

                <View style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                  <Ionicons name="cash" size={16} color={COLORS.textSecondary} />
                  <Text style={[styles.detailText, isRTL && styles.detailTextRTL]}>
                    {formatPrice(booking.totalPrice)}
                  </Text>
                </View>
              </View>

              <View style={[styles.cardFooter, isRTL && styles.cardFooterRTL]}>
                <View style={[styles.paymentStatus, isRTL && styles.paymentStatusRTL]}>
                  <Ionicons
                    name={
                      booking.paymentStatus === 'paid'
                        ? 'checkmark-circle'
                        : 'alert-circle'
                    }
                    size={16}
                    color={booking.paymentStatus === 'paid' ? COLORS.success : '#FFA726'}
                  />
                  <Text
                    style={styles.paymentText}
                    accessibilityLabel={`Payment ${booking.paymentStatus === 'paid' ? 'completed' : 'pending'}`}
                  >
                    {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                  </Text>
                </View>
                <Ionicons
                  name={isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={20}
                  color={COLORS.textTertiary}
                  accessibilityElementsHidden={true}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: SIZES.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  headerSubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.white,
    opacity: 0.9,
  },
  textRTL: {
    textAlign: 'right',
  },
  content: {
    padding: SIZES.lg,
  },
  // Skeleton header styles
  skeletonHeader: {
    alignItems: 'flex-start',
  },
  skeletonTitle: {
    width: 180,
    height: 28,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.sm,
  },
  skeletonSubtitle: {
    width: 220,
    height: 14,
    borderRadius: SIZES.radiusSm,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: SIZES.minTouchTarget,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  cardHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  bookingNumber: {
    fontSize: SIZES.caption,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusSm,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  serviceName: {
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  detailsContainer: {
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  detailRowRTL: {
    flexDirection: 'row-reverse',
  },
  detailText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  detailTextRTL: {
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  cardFooterRTL: {
    flexDirection: 'row-reverse',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  paymentStatusRTL: {
    flexDirection: 'row-reverse',
  },
  paymentText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
