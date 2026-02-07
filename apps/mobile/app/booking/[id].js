import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function BookingDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${id}`);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooking();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA726',
      confirmed: '#42A5F5',
      in_progress: '#AB47BC',
      completed: '#66BB6A',
      cancelled: '#EF5350',
      no_show: '#78909C'
    };
    return colors[status] || '#999';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'time-outline',
      confirmed: 'checkmark-circle-outline',
      in_progress: 'car-sport-outline',
      completed: 'checkmark-done-circle-outline',
      cancelled: 'close-circle-outline',
      no_show: 'alert-circle-outline'
    };
    return icons[status] || 'help-circle-outline';
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api.put(`/bookings/${id}/cancel`);
              setBooking(prev => ({ ...prev, status: 'cancelled' }));
              Alert.alert('Success', 'Your booking has been cancelled');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const handleReschedule = () => {
    router.push({
      pathname: '/(tabs)/services',
      params: {
        reschedule: 'true',
        bookingId: id,
        serviceId: booking?.serviceId?._id
      }
    });
  };

  const handleRebook = () => {
    router.push({
      pathname: '/(tabs)/services',
      params: {
        rebook: 'true',
        serviceId: booking?.serviceId?._id,
        vehicleId: booking?.vehicleId?._id
      }
    });
  };

  const handleContactSupport = () => {
    const phoneNumber = '+971585908876';
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = () => {
    const phoneNumber = '971585908876';
    const message = `Hi, I need help with my booking #${booking?.bookingNumber}`;
    Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="car" size={48} color="#1E88E5" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF5350" />
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const canReschedule = ['pending', 'confirmed'].includes(booking.status);
  const canRebook = booking.status === 'completed';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor(booking.status) }]}>
          <Ionicons name={getStatusIcon(booking.status)} size={32} color="#fff" />
        </View>
        <Text style={styles.statusTitle}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
        </Text>
        <Text style={styles.bookingNumber}>#{booking.bookingNumber}</Text>
      </View>

      {/* Service Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service</Text>
        <View style={styles.card}>
          <View style={styles.serviceRow}>
            <Ionicons name="sparkles" size={24} color="#1E88E5" />
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{booking.serviceId?.name || 'Car Wash'}</Text>
              <Text style={styles.servicePrice}>AED {booking.totalPrice?.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date(booking.scheduledDate).toLocaleDateString('en-AE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{booking.scheduledTime}</Text>
          </View>
        </View>
      </View>

      {/* Vehicle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>
              {booking.vehicleId?.make} {booking.vehicleId?.model}
            </Text>
          </View>
          {booking.vehicleId?.plateNumber && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={20} color="#666" />
                <Text style={styles.detailLabel}>Plate</Text>
                <Text style={styles.detailValue}>{booking.vehicleId.plateNumber}</Text>
              </View>
            </>
          )}
          {booking.vehicleId?.color && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Ionicons name="color-palette-outline" size={20} color="#666" />
                <Text style={styles.detailLabel}>Color</Text>
                <Text style={styles.detailValue}>{booking.vehicleId.color}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Location */}
      {booking.location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {booking.location.address || `${booking.location.area}, ${booking.location.villa}`}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Payment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Ionicons name="wallet-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Method</Text>
            <Text style={styles.detailValue}>
              {booking.paymentMethod === 'cash' ? 'Cash' : 'Card'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Ionicons
              name={booking.paymentStatus === 'paid' ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={booking.paymentStatus === 'paid' ? '#66BB6A' : '#FFA726'}
            />
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[
              styles.detailValue,
              { color: booking.paymentStatus === 'paid' ? '#66BB6A' : '#FFA726' }
            ]}>
              {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Ionicons name="pricetag-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={[styles.detailValue, styles.priceValue]}>
              AED {booking.totalPrice?.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Special Instructions */}
      {booking.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {canReschedule && (
          <TouchableOpacity style={styles.rescheduleButton} onPress={handleReschedule}>
            <Ionicons name="calendar-outline" size={20} color="#1E88E5" />
            <Text style={styles.rescheduleButtonText}>Reschedule</Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, cancelling && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            <Ionicons name="close-circle-outline" size={20} color="#EF5350" />
            <Text style={styles.cancelButtonText}>
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Text>
          </TouchableOpacity>
        )}

        {canRebook && (
          <TouchableOpacity style={styles.rebookButton} onPress={handleRebook}>
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.rebookButtonText}>Book Again</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Support Section */}
      <View style={styles.supportSection}>
        <Text style={styles.supportTitle}>Need Help?</Text>
        <View style={styles.supportButtons}>
          <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
            <Ionicons name="call-outline" size={24} color="#1E88E5" />
            <Text style={styles.supportButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportButton} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.supportButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    marginBottom: 24
  },
  backButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backIcon: {
    padding: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerPlaceholder: {
    width: 32
  },
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  bookingNumber: {
    fontSize: 14,
    color: '#999'
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  serviceInfo: {
    flex: 1
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  servicePrice: {
    fontSize: 14,
    color: '#1E88E5',
    marginTop: 2
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    width: 60
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right'
  },
  priceValue: {
    fontWeight: 'bold',
    color: '#1E88E5'
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  actionsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 12
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E88E5',
    gap: 8
  },
  rescheduleButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '600'
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF5350',
    gap: 8
  },
  cancelButtonText: {
    color: '#EF5350',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  rebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E88E5',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  rebookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  supportSection: {
    marginTop: 32,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16
  },
  supportButtons: {
    flexDirection: 'row',
    gap: 24
  },
  supportButton: {
    alignItems: 'center',
    gap: 6
  },
  supportButtonText: {
    fontSize: 12,
    color: '#666'
  }
});
