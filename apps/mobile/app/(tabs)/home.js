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
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { createApiCall, getErrorMessage } from '../../utils/api-helpers';
import { HomeScreenSkeleton, BookingCardSkeleton } from '../../components/Skeleton';
import { ErrorView, EmptyState } from '../../components/ErrorBoundary';
import {
  getButtonAccessibility,
  getHeaderAccessibility,
  getCardAccessibility,
  getLiveRegion,
} from '../../utils/accessibility';
import { COLORS, SIZES } from '../../constants/theme';
import { formatDate, formatTime } from '@3on/shared';

// Create wrapped API call with error handling
const fetchBookingsWithRetry = createApiCall(
  (params) => api.get('/bookings', { params }),
  { context: 'Fetching bookings', retries: 3 }
);

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const isRTL = I18nManager.isRTL;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else {
      fetchUpcomingBookings();
    }
  }, [isAuthenticated]);

  const fetchUpcomingBookings = useCallback(async () => {
    setError(null);
    
    const result = await fetchBookingsWithRetry({ status: 'confirmed' });
    
    if (result.success) {
      setUpcomingBookings(result.data.bookings?.slice(0, 3) || []);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUpcomingBookings();
    setRefreshing(false);
  }, [fetchUpcomingBookings]);

  // Show skeleton while loading
  if (loading) {
    return <HomeScreenSkeleton />;
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
      accessibilityLabel="Home screen"
    >
      <LinearGradient colors={['#1E88E5', '#1565C0']} style={styles.header}>
        <View style={[styles.headerContent, isRTL && styles.headerContentRTL]}>
          <View>
            <Text
              style={styles.greeting}
              accessibilityLabel="Greeting"
            >
              Hello,
            </Text>
            <Text
              style={styles.userName}
              {...getHeaderAccessibility(`Welcome ${user?.firstName}`)}
            >
              {user?.firstName}!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            {...getButtonAccessibility(
              'Notifications',
              'View your notifications'
            )}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Actions */}
        <View
          style={[styles.quickActions, isRTL && styles.quickActionsRTL]}
          accessibilityRole="menu"
          accessibilityLabel="Quick actions"
        >
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/services')}
            {...getButtonAccessibility(
              'Book Now',
              'Navigate to book a car wash service'
            )}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="add-circle" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Book Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/vehicles')}
            {...getButtonAccessibility(
              'My Vehicles',
              'View and manage your vehicles'
            )}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="car" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>My Vehicles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/bookings')}
            {...getButtonAccessibility(
              'History',
              'View your booking history'
            )}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="list" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Bookings Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, isRTL && styles.textRTL]}
            {...getHeaderAccessibility('Upcoming Bookings')}
          >
            Upcoming Bookings
          </Text>

          {error ? (
            <ErrorView
              error={error}
              onRetry={fetchUpcomingBookings}
              title="Couldn't load bookings"
            />
          ) : upcomingBookings.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No upcoming bookings"
              message="You don't have any upcoming car wash appointments."
              actionLabel="Book a Service"
              onAction={() => router.push('/(tabs)/services')}
            />
          ) : (
            <View {...getLiveRegion('polite')}>
              {upcomingBookings.map((booking) => (
                <TouchableOpacity
                  key={booking._id}
                  style={styles.bookingCard}
                  onPress={() => router.push(`/booking/${booking._id}`)}
                  {...getButtonAccessibility(
                    `${booking.serviceId?.name} on ${formatDate(booking.scheduledDate)}`,
                    'View booking details'
                  )}
                >
                  <View style={[styles.bookingHeader, isRTL && styles.bookingHeaderRTL]}>
                    <Text style={[styles.serviceName, isRTL && styles.textRTL]}>
                      {booking.serviceId?.name}
                    </Text>
                    <View
                      style={styles.statusBadge}
                      accessibilityLabel={`Status: ${booking.status}`}
                    >
                      <Text style={styles.bookingStatus}>{booking.status}</Text>
                    </View>
                  </View>
                  <View style={styles.bookingDetails}>
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
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Popular Services Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, isRTL && styles.textRTL]}
            {...getHeaderAccessibility('Popular Services')}
          >
            Popular Services
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.servicesScroll,
              isRTL && { flexDirection: 'row-reverse' }
            ]}
            accessibilityRole="list"
            accessibilityLabel="Popular services list"
          >
            {['Basic Wash', 'Premium Detail', 'Interior Clean'].map(
              (service, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.serviceCard}
                  onPress={() => router.push('/(tabs)/services')}
                  {...getButtonAccessibility(
                    service,
                    `Book ${service}`
                  )}
                >
                  <View style={styles.serviceIcon}>
                    <Ionicons name="car-sport" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.serviceCardText}>{service}</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>
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
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: SIZES.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContentRTL: {
    flexDirection: 'row-reverse',
  },
  greeting: {
    fontSize: SIZES.body,
    color: COLORS.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  notificationButton: {
    width: SIZES.minTouchTarget,
    height: SIZES.minTouchTarget,
    borderRadius: SIZES.minTouchTarget / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SIZES.lg,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.xl,
  },
  quickActionsRTL: {
    flexDirection: 'row-reverse',
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginHorizontal: SIZES.xs,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: SIZES.minTouchTarget,
  },
  iconContainer: {
    marginBottom: SIZES.sm,
  },
  actionText: {
    fontSize: SIZES.caption,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  textRTL: {
    textAlign: 'right',
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  bookingHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  serviceName: {
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  bookingStatus: {
    fontSize: SIZES.caption,
    color: COLORS.success,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  bookingDetails: {
    gap: SIZES.sm,
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
  servicesScroll: {
    paddingEnd: SIZES.md,
  },
  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginEnd: SIZES.md,
    width: 120,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: SIZES.minTouchTarget,
  },
  serviceIcon: {
    marginBottom: SIZES.sm,
  },
  serviceCardText: {
    fontSize: SIZES.caption,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
