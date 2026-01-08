import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const COUNTRY_CODES = [
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' }
];

export default function PhoneLogin() {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const otpInputs = useRef([]);
  const { loginWithPhone, verifyOTP } = useAuth();
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 7) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    const fullPhone = `${selectedCountry.code}${phoneNumber}`;
    const result = await loginWithPhone(fullPhone);
    setLoading(false);

    if (result.success) {
      setStep('otp');
      Alert.alert('Success', 'OTP sent to your phone number');
    } else {
      Alert.alert('Error', result.error || 'Failed to send OTP');
    }
  };

  const handleOTPChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    setLoading(true);
    const fullPhone = `${selectedCountry.code}${phoneNumber}`;
    const result = await verifyOTP(fullPhone, otpCode);
    setLoading(false);

    if (result.success) {
      router.push('/location-setup');
    } else {
      Alert.alert('Error', result.error || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
    }
  };

  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <MaterialIcons name="phone-iphone" size={80} color="#fff" style={styles.icon} />
      <Text style={styles.title}>Enter Your Phone Number</Text>
      <Text style={styles.subtitle}>We'll send you a verification code</Text>

      {/* Country Code Selector */}
      <TouchableOpacity
        style={styles.countrySelector}
        onPress={() => setShowCountryPicker(!showCountryPicker)}
      >
        <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
        <Text style={styles.countryCode}>{selectedCountry.code}</Text>
        <MaterialIcons name={showCountryPicker ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color="#333" />
      </TouchableOpacity>

      {/* Country Picker Dropdown */}
      {showCountryPicker && (
        <View style={styles.countryPicker}>
          {COUNTRY_CODES.map((country, index) => (
            <TouchableOpacity
              key={index}
              style={styles.countryOption}
              onPress={() => {
                setSelectedCountry(country);
                setShowCountryPicker(false);
              }}
            >
              <Text style={styles.countryFlag}>{country.flag}</Text>
              <Text style={styles.countryName}>{country.country}</Text>
              <Text style={styles.countryCodeText}>{country.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Phone Number Input */}
      <View style={styles.phoneInputContainer}>
        <Text style={styles.phonePrefix}>{selectedCountry.code}</Text>
        <TextInput
          style={styles.phoneInput}
          placeholder="50 123 4567"
          placeholderTextColor="#999"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send OTP'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <MaterialIcons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backButtonText}>Back to options</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <MaterialIcons name="security" size={80} color="#fff" style={styles.icon} />
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        Code sent to {selectedCountry.code} {phoneNumber}
      </Text>

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (otpInputs.current[index] = ref)}
            style={styles.otpInput}
            value={digit}
            onChangeText={(text) => handleOTPChange(text, index)}
            onKeyPress={(e) => handleOTPKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>

      {/* Resend OTP */}
      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleSendOTP}
      >
        <Text style={styles.resendButtonText}>Didn't receive code? Resend</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setStep('phone');
          setOtp(['', '', '', '', '', '']);
        }}
      >
        <MaterialIcons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backButtonText}>Change phone number</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#1E88E5', '#1565C0']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 'phone' ? renderPhoneStep() : renderOTPStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20
  },
  stepContainer: {
    alignItems: 'center'
  },
  icon: {
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    width: '100%'
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 10
  },
  countryCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  countryPicker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    maxHeight: 250
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  countryName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 10
  },
  countryCodeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%'
  },
  phonePrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 10
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    paddingVertical: 15
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    width: '100%',
    paddingHorizontal: 10
  },
  otpInput: {
    width: 50,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333'
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#1E88E5',
    fontSize: 18,
    fontWeight: 'bold'
  },
  resendButton: {
    marginBottom: 20
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5
  }
});
