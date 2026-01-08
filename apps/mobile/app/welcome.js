import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Welcome() {
  const router = useRouter();

  useEffect(() => {
    // Mark that user has seen the welcome screen
    AsyncStorage.setItem('welcomeSeen', 'true');
  }, []);

  return (
    <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons name="local-car-wash" size={120} color="#fff" />
          </View>

          {/* Title */}
          <Text style={styles.title}>In & Out Car Wash</Text>
          <Text style={styles.subtitle}>Premium Car Cleaning Services</Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <MaterialIcons name="check-circle" size={24} color="#fff" />
              <Text style={styles.featureText}>Book services anytime</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="check-circle" size={24} color="#fff" />
              <Text style={styles.featureText}>Track your bookings</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="check-circle" size={24} color="#fff" />
              <Text style={styles.featureText}>Multiple payment options</Text>
            </View>
          </View>

          {/* Authentication Options */}
          <View style={styles.authContainer}>
            {/* Phone/OTP Login */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/phone-login')}
            >
              <MaterialIcons name="phone" size={24} color="#FF6B35" />
              <Text style={styles.primaryButtonText}>Continue with Phone</Text>
            </TouchableOpacity>

            {/* Email/Password Login */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <MaterialIcons name="email" size={24} color="#fff" />
              <Text style={styles.secondaryButtonText}>Continue with Email</Text>
            </TouchableOpacity>

            {/* Guest Mode */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => router.push('/location-setup')}
            >
              <MaterialIcons name="person-outline" size={24} color="#fff" />
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 20
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.95
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500'
  },
  authContainer: {
    width: '100%',
    paddingHorizontal: 10
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  primaryButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#fff'
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  },
  guestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10
  },
  signupLink: {
    alignItems: 'center',
    paddingVertical: 10
  },
  signupText: {
    color: '#fff',
    fontSize: 15
  },
  signupTextBold: {
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  }
});
