/**
 * Skeleton Loading Components
 * Provides consistent loading states across the app
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, I18nManager } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Base Skeleton component with shimmer animation
 */
export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = SIZES.radiusSm,
  style 
}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: I18nManager.isRTL ? [SCREEN_WIDTH, -SCREEN_WIDTH] : [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
      accessibilityLabel="Loading content"
      accessibilityRole="progressbar"
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

/**
 * Skeleton for a booking card
 */
export function BookingCardSkeleton() {
  return (
    <View 
      style={styles.bookingCard}
      accessible={true}
      accessibilityLabel="Loading booking"
    >
      <View style={styles.cardHeader}>
        <Skeleton width={100} height={12} />
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
      <Skeleton width="60%" height={18} style={styles.marginTop} />
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width={120} height={14} style={styles.marginStart} />
        </View>
        <View style={styles.detailRow}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width={80} height={14} style={styles.marginStart} />
        </View>
        <View style={styles.detailRow}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width={140} height={14} style={styles.marginStart} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for a service card
 */
export function ServiceCardSkeleton() {
  return (
    <View 
      style={styles.serviceCard}
      accessible={true}
      accessibilityLabel="Loading service"
    >
      <View style={styles.serviceHeader}>
        <View>
          <Skeleton width={140} height={20} />
          <Skeleton width={80} height={12} style={[styles.marginTop, { marginTop: 8 }]} />
        </View>
        <Skeleton width={70} height={24} />
      </View>
      <Skeleton width="100%" height={40} style={styles.marginTop} />
      <View style={styles.featuresContainer}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.featureRow}>
            <Skeleton width={16} height={16} borderRadius={8} />
            <Skeleton width={120} height={14} style={styles.marginStart} />
          </View>
        ))}
      </View>
      <View style={styles.serviceFooter}>
        <Skeleton width={80} height={16} />
        <Skeleton width={100} height={40} borderRadius={SIZES.radiusMd} />
      </View>
    </View>
  );
}

/**
 * Skeleton for the home screen
 */
export function HomeScreenSkeleton() {
  return (
    <View 
      style={styles.homeContainer}
      accessible={true}
      accessibilityLabel="Loading home screen"
    >
      {/* Header skeleton */}
      <View style={styles.homeHeader}>
        <View>
          <Skeleton width={60} height={16} />
          <Skeleton width={120} height={28} style={styles.marginTop} />
        </View>
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Quick actions skeleton */}
      <View style={styles.quickActions}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.actionCard}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width={60} height={14} style={styles.marginTop} />
          </View>
        ))}
      </View>

      {/* Upcoming bookings section */}
      <View style={styles.section}>
        <Skeleton width={160} height={20} style={styles.sectionTitle} />
        <View style={styles.emptyState}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width={140} height={16} style={styles.marginTop} />
          <Skeleton width={120} height={44} borderRadius={SIZES.radiusMd} style={styles.marginTop} />
        </View>
      </View>

      {/* Popular services section */}
      <View style={styles.section}>
        <Skeleton width={140} height={20} style={styles.sectionTitle} />
        <View style={styles.servicesRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.smallServiceCard}>
              <Skeleton width={28} height={28} borderRadius={14} />
              <Skeleton width={60} height={14} style={styles.marginTop} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for the profile screen
 */
export function ProfileScreenSkeleton() {
  return (
    <View 
      style={styles.profileContainer}
      accessible={true}
      accessibilityLabel="Loading profile"
    >
      {/* Avatar and name */}
      <View style={styles.profileHeader}>
        <Skeleton width={100} height={100} borderRadius={50} />
        <Skeleton width={150} height={24} style={[styles.marginTop, { marginTop: 15 }]} />
        <Skeleton width={180} height={14} style={styles.marginTop} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statBox}>
            <Skeleton width={40} height={24} />
            <Skeleton width={60} height={12} style={styles.marginTop} />
          </View>
        ))}
      </View>

      {/* Menu items */}
      <View style={styles.menuContainer}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={120} height={16} style={styles.marginStart} />
            </View>
            <Skeleton width={20} height={20} borderRadius={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Loading list placeholder
 */
export function ListSkeleton({ count = 3, renderItem }) {
  return (
    <View accessibilityLabel={`Loading ${count} items`}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index}>
          {renderItem ? renderItem(index) : <BookingCardSkeleton />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.gray200,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray100,
    opacity: 0.5,
  },
  
  // Booking card skeleton
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  marginTop: {
    marginTop: SIZES.sm,
  },
  marginStart: {
    marginStart: SIZES.sm,
  },
  detailsContainer: {
    marginTop: SIZES.md,
    gap: SIZES.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Service card skeleton
  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuresContainer: {
    marginTop: SIZES.md,
    gap: SIZES.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.lg,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },

  // Home screen skeleton
  homeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SIZES.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginHorizontal: SIZES.xs,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  section: {
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    marginBottom: SIZES.md,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xxl,
    alignItems: 'center',
  },
  servicesRow: {
    flexDirection: 'row',
  },
  smallServiceCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginEnd: SIZES.md,
    width: 120,
    alignItems: 'center',
    ...SHADOWS.small,
  },

  // Profile screen skeleton
  profileContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    margin: SIZES.lg,
    ...SHADOWS.small,
  },
  statBox: {
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    marginHorizontal: SIZES.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
