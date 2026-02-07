import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  I18nManager,
  ScrollView,
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
  ensureMinTouchTarget,
} from '../../utils/accessibility';
import { COLORS, SIZES } from '../../constants/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const router = useRouter();

  const isRTL = I18nManager.isRTL;

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)/home');
    } else {
      Alert.alert('Login Failed', result.error, [{ text: 'OK' }]);
    }
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
            {/* Logo/Brand Section */}
            <View style={styles.brandSection}>
              <Ionicons
                name="car-sport"
                size={64}
                color={COLORS.white}
                accessibilityElementsHidden={true}
              />
              <Text
                style={styles.title}
                {...getHeaderAccessibility('CarWash Pro')}
              >
                CarWash Pro
              </Text>
              <Text
                style={styles.subtitle}
                accessibilityLabel="Welcome back! Sign in to continue"
              >
                {isRTL ? 'مرحباً بعودتك' : 'Welcome Back'}
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.form} accessible={false}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={errors.email ? COLORS.error : COLORS.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, isRTL && styles.inputRTL]}
                    placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                    placeholderTextColor={COLORS.placeholderText}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) {
                        setErrors((prev) => ({ ...prev, email: null }));
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    {...getInputAccessibility(
                      'Email address',
                      'Enter your email address to log in',
                      true,
                      errors.email
                    )}
                  />
                </View>
                {errors.email && (
                  <Text
                    style={[styles.errorText, isRTL && styles.textRTL]}
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                  >
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={errors.password ? COLORS.error : COLORS.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, isRTL && styles.inputRTL]}
                    placeholder={isRTL ? 'كلمة المرور' : 'Password'}
                    placeholderTextColor={COLORS.placeholderText}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors((prev) => ({ ...prev, password: null }));
                      }
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    {...getInputAccessibility(
                      'Password',
                      'Enter your password to log in',
                      true,
                      errors.password
                    )}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.showPasswordButton}
                    {...getButtonAccessibility(
                      showPassword ? 'Hide password' : 'Show password',
                      'Toggle password visibility'
                    )}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text
                    style={[styles.errorText, isRTL && styles.textRTL]}
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                  >
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => router.push('/(auth)/forgot-password')}
                {...getLinkAccessibility(
                  isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?',
                  'Reset your password'
                )}
              >
                <Text style={[styles.forgotPasswordText, isRTL && styles.textRTL]}>
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
                {...getButtonAccessibility(
                  loading ? 'Logging in...' : 'Login',
                  'Double tap to log in to your account',
                  loading
                )}
              >
                {loading ? (
                  <Text style={styles.loginButtonText}>
                    {isRTL ? 'جارٍ تسجيل الدخول...' : 'Logging in...'}
                  </Text>
                ) : (
                  <Text style={styles.loginButtonText}>
                    {isRTL ? 'تسجيل الدخول' : 'Login'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Sign Up Link */}
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={() => router.push('/(auth)/register')}
                {...getLinkAccessibility(
                  isRTL ? 'ليس لديك حساب؟ سجل الآن' : "Don't have an account? Sign up",
                  'Create a new account'
                )}
              >
                <Text style={styles.signUpText}>
                  {isRTL
                    ? 'ليس لديك حساب؟ سجل الآن'
                    : "Don't have an account? Sign up"}
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SIZES.lg,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: SIZES.xxl,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.h4,
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
  inputContainer: {
    marginBottom: SIZES.md,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: SIZES.lg,
    padding: SIZES.xs,
    minHeight: SIZES.minTouchTarget,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: SIZES.caption,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    minHeight: SIZES.minTouchTarget,
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: SIZES.h5,
    fontWeight: 'bold',
  },
  signUpButton: {
    marginTop: SIZES.lg,
    padding: SIZES.sm,
    alignItems: 'center',
    minHeight: SIZES.minTouchTarget,
    justifyContent: 'center',
  },
  signUpText: {
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: SIZES.body,
    fontWeight: '500',
  },
});
