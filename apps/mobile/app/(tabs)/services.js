import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our Services</Text>
        <Text style={styles.headerSubtitle}>Choose the perfect wash for your car</Text>
      </View>

      <View style={styles.content}>
        {services.map((service) => (
          <View key={service._id} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceCategory}>{service.category}</Text>
              </View>
              <Text style={styles.servicePrice}>${service.basePrice}</Text>
            </View>

            <Text style={styles.serviceDescription}>{service.description}</Text>

            <View style={styles.featuresContainer}>
              {service.features?.slice(0, 4).map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.serviceFooter}>
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.durationText}>{service.duration} min</Text>
              </View>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => router.push(`/book/${service._id}`)}
              >
                <Text style={styles.bookButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  serviceCategory: {
    fontSize: 12,
    color: '#1E88E5',
    textTransform: 'uppercase',
    marginTop: 4
  },
  servicePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E88E5'
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20
  },
  featuresContainer: {
    marginBottom: 15
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  featureText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5
  },
  bookButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
