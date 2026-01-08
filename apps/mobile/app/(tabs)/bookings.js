import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>Track your car wash appointments</Text>
      </View>

      <View style={styles.content}>
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No bookings yet</Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/(tabs)/services')}
            >
              <Text style={styles.bookButtonText}>Book Your First Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity
              key={booking._id}
              style={styles.bookingCard}
              onPress={() => router.push(`/booking/${booking._id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.bookingNumber}>{booking.bookingNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                  <Text style={styles.statusText}>{booking.status}</Text>
                </View>
              </View>

              <Text style={styles.serviceName}>{booking.serviceId?.name}</Text>

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {new Date(booking.scheduledDate).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.detailText}>{booking.scheduledTime}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="car" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {booking.vehicleId?.make} {booking.vehicleId?.model}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={16} color="#666" />
                  <Text style={styles.detailText}>${booking.totalPrice.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.paymentStatus}>
                  <Ionicons
                    name={booking.paymentStatus === 'paid' ? 'checkmark-circle' : 'alert-circle'}
                    size={16}
                    color={booking.paymentStatus === 'paid' ? '#4CAF50' : '#FFA726'}
                  />
                  <Text style={styles.paymentText}>
                    {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
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
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9
  },
  content: {
    padding: 20
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    marginTop: 20
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
    marginBottom: 30
  },
  bookButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  bookingNumber: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600'
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  detailText: {
    fontSize: 14,
    color: '#666'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  paymentText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500'
  }
});
