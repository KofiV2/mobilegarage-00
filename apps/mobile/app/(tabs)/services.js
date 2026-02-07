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
import { ListSkeleton, ServiceCardSkeleton } from '../../components/Skeleton';
import { ErrorView, EmptyState } from '../../components/ErrorBoundary';
import {
  getButtonAccessibility,
  getHeaderAccessibility,
  getLiveRegion,
} from '../../utils/accessibility';
import { COLORS, SIZES } from '../../constants/theme';
import { formatPrice } from '@3on/shared';

// Create wrapped API call with error handling
const fetchServicesWithRetry = createApiCall(
  () => api.get('/services'),
  { context: 'Fetching services', retries: 3 }
);

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const isRTL = I18nManager.isRTL;

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = useCallback(async () => {
    setError(null);
    
    const result = await fetchServicesWithRetry();
    
    if (result.success) {
      setServices(result.data.services || []);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }, [fetchServices]);

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
          <ListSkeleton count={3} renderItem={() => <ServiceCardSkeleton />} />
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
      accessibilityLabel="Services list"
    >
      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, isRTL && styles.textRTL]}
          {...getHeaderAccessibility('Our Services')}
        >
          Our Services
        </Text>
        <Text
          style={[styles.headerSubtitle, isRTL && styles.textRTL]}
          accessibilityLabel="Choose the perfect wash for your car"
        >
          Choose the perfect wash for your car
        </Text>
      </View>

      <View style={styles.content} {...getLiveRegion('polite')}>
        {error ? (
          <ErrorView
            error={error}
            onRetry={fetchServices}
            title="Couldn't load services"
            message={error.message}
          />
        ) : services.length === 0 ? (
          <EmptyState
            icon="car-sport-outline"
            title="No services available"
            message="Services are currently unavailable. Please try again later."
            actionLabel="Refresh"
            onAction={fetchServices}
          />
        ) : (
          services.map((service) => (
            <View
              key={service._id}
              style={styles.serviceCard}
              accessible={false}
            >
              <View style={[styles.serviceHeader, isRTL && styles.serviceHeaderRTL]}>
                <View>
                  <Text
                    style={[styles.serviceName, isRTL && styles.textRTL]}
                    {...getHeaderAccessibility(service.name)}
                  >
                    {service.name}
                  </Text>
                  <Text
                    style={[styles.serviceCategory, isRTL && styles.textRTL]}
                    accessibilityLabel={`Category: ${service.category}`}
                  >
                    {service.category}
                  </Text>
                </View>
                <Text
                  style={styles.servicePrice}
                  accessibilityLabel={`Price: ${formatPrice(service.basePrice)}`}
                >
                  {formatPrice(service.basePrice)}
                </Text>
              </View>

              <Text
                style={[styles.serviceDescription, isRTL && styles.textRTL]}
                accessibilityLabel={`Description: ${service.description}`}
              >
                {service.description}
              </Text>

              <View
                style={styles.featuresContainer}
                accessibilityRole="list"
                accessibilityLabel="Service features"
              >
                {service.features?.slice(0, 4).map((feature, index) => (
                  <View
                    key={index}
                    style={[styles.featureRow, isRTL && styles.featureRowRTL]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.success}
                      accessibilityElementsHidden={true}
                    />
                    <Text
                      style={[styles.featureText, isRTL && styles.textRTL]}
                      accessibilityLabel={`Includes: ${feature}`}
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={[styles.serviceFooter, isRTL && styles.serviceFooterRTL]}>
                <View style={[styles.durationContainer, isRTL && styles.durationContainerRTL]}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={COLORS.textSecondary}
                    accessibilityElementsHidden={true}
                  />
                  <Text
                    style={styles.durationText}
                    accessibilityLabel={`Duration: ${service.duration} minutes`}
                  >
                    {service.duration} min
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => router.push(`/book/${service._id}`)}
                  {...getButtonAccessibility(
                    `Book ${service.name}`,
                    `Book this ${service.name} service for ${formatPrice(service.basePrice)}`
                  )}
                >
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    width: 160,
    height: 28,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.sm,
  },
  skeletonSubtitle: {
    width: 240,
    height: 14,
    borderRadius: SIZES.radiusSm,
  },
  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },
  serviceHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  serviceName: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  serviceCategory: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginTop: SIZES.xs,
  },
  servicePrice: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  serviceDescription: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: SIZES.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  featureRowRTL: {
    flexDirection: 'row-reverse',
  },
  featureText: {
    fontSize: SIZES.caption,
    color: COLORS.textPrimary,
    marginStart: SIZES.sm,
    flex: 1,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.sm,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  serviceFooterRTL: {
    flexDirection: 'row-reverse',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationContainerRTL: {
    flexDirection: 'row-reverse',
  },
  durationText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginStart: SIZES.xs,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    minWidth: SIZES.minTouchTarget,
    minHeight: SIZES.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: SIZES.caption,
    fontWeight: 'bold',
  },
});
