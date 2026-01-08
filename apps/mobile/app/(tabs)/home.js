import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else {
      fetchUpcomingBookings();
    }
  }, [isAuthenticated]);

  const fetchUpcomingBookings = async () => {
    try {
      const response = await api.get('/bookings', {
        params: { status: 'confirmed' }
      });
      setUpcomingBookings(response.data.bookings.slice(0, 3));
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUpcomingBookings();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient colors={['#1E88E5', '#1565C0']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.firstName}!</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/services')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="add-circle" size={32} color="#1E88E5" />
            </View>
            <Text style={styles.actionText}>Book Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/vehicles')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="car" size={32} color="#1E88E5" />
            </View>
            <Text style={styles.actionText}>My Vehicles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/bookings')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="list" size={32} color="#1E88E5" />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          {upcomingBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No upcoming bookings</Text>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => router.push('/(tabs)/services')}
              >
                <Text style={styles.bookButtonText}>Book a Service</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingBookings.map((booking) => (
              <TouchableOpacity
                key={booking._id}
                style={styles.bookingCard}
                onPress={() => router.push(`/booking/${booking._id}`)}
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.serviceName}>
                    {booking.serviceId?.name}
                  </Text>
                  <Text style={styles.bookingStatus}>{booking.status}</Text>
                </View>
                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {new Date(booking.scheduledDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {booking.scheduledTime}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="car" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {booking.vehicleId?.make} {booking.vehicleId?.model}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Basic Wash', 'Premium Detail', 'Interior Clean'].map(
              (service, index) => (
                <View key={index} style={styles.serviceCard}>
                  <View style={styles.serviceIcon}>
                    <Ionicons name="car-sport" size={28} color="#1E88E5" />
                  </View>
                  <Text style={styles.serviceCardText}>{service}</Text>
                </View>
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
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    padding: 20
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  iconContainer: {
    marginBottom: 10
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center'
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    marginBottom: 20
  },
  bookButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  bookingStatus: {
    fontSize: 12,
    color: '#4CAF50',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  bookingDetails: {
    gap: 8
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
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginRight: 15,
    width: 120,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  serviceIcon: {
    marginBottom: 10
  },
  serviceCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center'
  }
});
