import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card' },
  { id: 'cash', name: 'Cash on Service', icon: 'money' },
  { id: 'apple-pay', name: 'Apple Pay', icon: 'apple' },
  { id: 'google-pay', name: 'Google Pay', icon: 'google' }
];

export default function Checkout() {
  const { isGuest, user, login, register, convertGuestToUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [processing, setProcessing] = useState(false);

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Booking details from params
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    // Load booking data from params
    if (params.bookingData) {
      try {
        setBookingData(JSON.parse(params.bookingData));
      } catch (error) {
        console.error('Error parsing booking data:', error);
      }
    }
  }, [params]);

  const handlePaymentSelect = (method) => {
    setSelectedPayment(method);

    // If user is guest, show auth modal before proceeding
    if (isGuest) {
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async () => {
    if (authMode === 'login') {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      setProcessing(true);
      const result = await login(email, password);
      setProcessing(false);

      if (result.success) {
        setShowAuthModal(false);
        proceedToPayment();
      } else {
        Alert.alert('Login Failed', result.error);
      }
    } else {
      // Register
      if (!email || !password || !name || !phone) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      setProcessing(true);
      const result = await register({
        email,
        password,
        name,
        phone
      });
      setProcessing(false);

      if (result.success) {
        setShowAuthModal(false);
        proceedToPayment();
      } else {
        Alert.alert('Registration Failed', result.error);
      }
    }
  };

  const proceedToPayment = async () => {
    if (!selectedPayment) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setProcessing(true);

      // Create booking with payment method
      const response = await api.post('/bookings', {
        ...bookingData,
        paymentMethod: selectedPayment.id
      });

      setProcessing(false);

      if (response.data.success) {
        Alert.alert(
          'Booking Confirmed!',
          'Your booking has been confirmed. You will receive a confirmation shortly.',
          [
            {
              text: 'View Booking',
              onPress: () => router.replace('/(tabs)/bookings')
            }
          ]
        );
      }
    } catch (error) {
      setProcessing(false);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create booking');
    }
  };

  const renderAuthModal = () => (
    <Modal
      visible={showAuthModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAuthModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {authMode === 'login' ? 'Login to Continue' : 'Create Account'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAuthModal(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            {authMode === 'register' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAuthSubmit}
              disabled={processing}
            >
              <Text style={styles.submitButtonText}>
                {processing ? 'Processing...' : authMode === 'login' ? 'Login' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            >
              <Text style={styles.switchModeText}>
                {authMode === 'login'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Booking Summary */}
        {bookingData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service</Text>
                <Text style={styles.summaryValue}>{bookingData.serviceName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{bookingData.date}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>{bookingData.time}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>
                  ${bookingData.totalPrice?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Guest Notice */}
        {isGuest && (
          <View style={styles.guestNotice}>
            <MaterialIcons name="info" size={20} color="#FF6B35" />
            <Text style={styles.guestNoticeText}>
              You'll need to login or create an account to complete your booking
            </Text>
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPayment?.id === method.id && styles.paymentMethodSelected
              ]}
              onPress={() => handlePaymentSelect(method)}
            >
              <View style={styles.paymentMethodLeft}>
                <MaterialIcons
                  name={method.icon}
                  size={24}
                  color={selectedPayment?.id === method.id ? '#FF6B35' : '#666'}
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    selectedPayment?.id === method.id && styles.paymentMethodTextSelected
                  ]}
                >
                  {method.name}
                </Text>
              </View>
              {selectedPayment?.id === method.id && (
                <MaterialIcons name="check-circle" size={24} color="#FF6B35" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Proceed Button - Only show if not guest or already authenticated */}
        {!isGuest && (
          <TouchableOpacity
            style={[
              styles.proceedButton,
              (!selectedPayment || processing) && styles.proceedButtonDisabled
            ]}
            onPress={proceedToPayment}
            disabled={!selectedPayment || processing}
          >
            <Text style={styles.proceedButtonText}>
              {processing ? 'Processing...' : 'Complete Booking'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {renderAuthModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  backButton: {
    padding: 5
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSpacer: {
    width: 34
  },
  content: {
    flex: 1,
    padding: 20
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666'
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35'
  },
  guestNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20
  },
  guestNoticeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#E65100'
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  paymentMethodSelected: {
    borderColor: '#FF6B35'
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12
  },
  paymentMethodTextSelected: {
    color: '#FF6B35',
    fontWeight: '600'
  },
  proceedButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30
  },
  proceedButtonDisabled: {
    backgroundColor: '#ccc'
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 5
  },
  modalForm: {
    padding: 20
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333'
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  switchModeButton: {
    marginTop: 15,
    alignItems: 'center'
  },
  switchModeText: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '500'
  }
});
