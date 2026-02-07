import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  getButtonAccessibility,
  getInputAccessibility,
  getHeaderAccessibility,
  getLinkAccessibility,
} from '../../utils/accessibility';
import { COLORS, SIZES } from '../../constants/theme';
import { isValidPhone, checkPasswordStrength } from '@3on/shared';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const isRTL = I18nManager.isRTL;

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { email, password, confirmPassword, firstName, lastName, phone } = formData;

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(phone)) {
      newErrors.phone = 'Please enter a valid UAE phone number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const strength = checkPasswordStrength(password);
      if (strength.score < 2) {
        newErrors.password = strength.feedback || 'Password is too weak';
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      // Announce errors to screen reader
      const errorCount = Object.keys(errors).length;
      Alert.alert(
        'Please fix the following errors',
        Object.values(errors).filter(Boolean).join('\n')
      );
      return;
    }

    setLoading(true);
    const result = await register({
      email: formData.email.trim(),
      password: formData.password,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
    });
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)/home');
    } else {
      Alert.alert('Registration Failed', result.error, [{ text: 'OK' }]);
    }
  };

  const renderInput = (field, placeholder, options = {}) => {
    const {
      keyboardType = 'default',
      autoCapitalize = 'none',
      secureTextEntry = false,
      icon,
      showToggle = false,
      showState,
      setShowState,
    } = options;

    const hasError = !!errors[field];

    return (
      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, hasError && styles.inputError]}>
          <Ionicons
            name={icon}
            size={20}
            color={hasError ? COLORS.error : COLORS.textSecondary}
            style={styles.inputIcon}
            accessibilityElementsHidden={true}
          />
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={placeholder}
            placeholderTextColor={COLORS.placeholderText}
            value={formData[field]}
            onChangeText={(value) => updateField(field, value)}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry && !showState}
            {...getInputAccessibility(
              placeholder,
              `Enter your ${placeholder.toLowerCase()}`,
              true,
              errors[field]
            )}
          />
          {showToggle && (
            <TouchableOpacity
              onPress={() => setShowState(!showState)}
              style={styles.showPasswordButton}
              {...getButtonAccessibility(
                showState ? 'Hide password' : 'Show password',
                'Toggle password visibility'
              )}
            >
              <Ionicons
                name={showState ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        {hasError && (
          <Text
            style={[styles.errorText, isRTL && styles.textRTL]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {errors[field]}
          </Text>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#1E88E5', '#1565C0']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.headerSection}>
              <Ionicons
                name="person-add"
                size={48}
                color={COLORS.white}
                accessibilityElementsHidden={true}
              />
              <Text
                style={styles.title}
                {...getHeaderAccessibility('Create Account')}
              >
                {isRTL ? 'إنشاء حساب' : 'Create Account'}
              </Text>
              <Text
                style={styles.subtitle}
                accessibilityLabel="Join CarWash Pro to book car wash services"
              >
                {isRTL ? 'انضم إلى كار واش برو' : 'Join CarWash Pro'}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form} accessible={false}>
              <View style={[styles.nameRow, isRTL && styles.nameRowRTL]}>
                <View style={styles.nameField}>
                  {renderInput('firstName', isRTL ? 'الاسم الأول' : 'First Name', {
                    icon: 'person-outline',
                    autoCapitalize: 'words',
                  })}
                </View>
                <View style={styles.nameField}>
                  {renderInput('lastName', isRTL ? 'اسم العائلة' : 'Last Name', {
                    icon: 'person-outline',
                    autoCapitalize: 'words',
                  })}
                </View>
              </View>

              {renderInput('email', isRTL ? 'البريد الإلكتروني' : 'Email', {
                icon: 'mail-outline',
                keyboardType: 'email-address',
              })}

              {renderInput('phone', isRTL ? 'رقم الهاتف' : 'Phone', {
                icon: 'call-outline',
                keyboardType: 'phone-pad',
              })}

              {renderInput('password', isRTL ? 'كلمة المرور' : 'Password', {
                icon: 'lock-closed-outline',
                secureTextEntry: true,
                showToggle: true,
                showState: showPassword,
                setShowState: setShowPassword,
              })}

              {renderInput('confirmPassword', isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password', {
                icon: 'lock-closed-outline',
                secureTextEntry: true,
                showToggle: true,
                showState: showConfirmPassword,
                setShowState: setShowConfirmPassword,
              })}

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  loading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={loading}
                {...getButtonAccessibility(
                  loading ? 'Creating account...' : 'Sign Up',
                  'Create your account',
                  loading
                )}
              >
                <Text style={styles.registerButtonText}>
                  {loading
                    ? isRTL ? 'جارٍ الإنشاء...' : 'Creating Account...'
                    : isRTL ? 'التسجيل' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLinkButton}
                onPress={() => router.push('/(auth)/login')}
                {...getLinkAccessibility(
                  isRTL ? 'لديك حساب؟ تسجيل الدخول' : 'Already have an account? Login',
                  'Go to login screen'
                )}
              >
                <Text style={styles.linkText}>
                  {isRTL ? 'لديك حساب؟ تسجيل الدخول' : 'Already have an account? Login'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.lg,
  },
  content: {
    paddingVertical: SIZES.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.h5,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  nameRow: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  nameRowRTL: {
    flexDirection: 'row-reverse',
  },
  nameField: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: SIZES.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: SIZES.md,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  inputIcon: {
    marginEnd: SIZES.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    minHeight: SIZES.minTouchTarget,
  },
  inputRTL: {
    textAlign: 'right',
  },
  showPasswordButton: {
    padding: SIZES.sm,
    minWidth: SIZES.minTouchTarget,
    minHeight: SIZES.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.caption,
    marginTop: SIZES.xs,
    marginStart: SIZES.xs,
  },
  textRTL: {
    textAlign: 'right',
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    marginTop: SIZES.md,
    minHeight: SIZES.minTouchTarget,
    justifyContent: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: SIZES.h5,
    fontWeight: 'bold',
  },
  loginLinkButton: {
    marginTop: SIZES.md,
    padding: SIZES.sm,
    alignItems: 'center',
    minHeight: SIZES.minTouchTarget,
    justifyContent: 'center',
  },
  linkText: {
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: SIZES.body,
    fontWeight: '500',
  },
});
