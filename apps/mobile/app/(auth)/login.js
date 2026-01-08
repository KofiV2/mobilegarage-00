import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)/home');
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <LinearGradient colors={['#1E88E5', '#1565C0']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text
            style={styles.title}
            accessibilityRole="header"
            accessibilityLabel="CarWash Pro"
          >
            CarWash Pro
          </Text>
          <Text
            style={styles.subtitle}
            accessibilityLabel="Welcome Back to CarWash Pro"
          >
            Welcome Back
          </Text>

          <View
            style={styles.form}
            accessible={false}
          >
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address to log in"
              accessible={true}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="Password"
              accessibilityHint="Enter your password to log in"
              accessible={true}
            />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={loading ? 'Logging in' : 'Login'}
              accessibilityHint="Double tap to log in to your account"
              accessibilityState={{ disabled: loading }}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              accessibilityRole="button"
              accessibilityLabel="Sign up"
              accessibilityHint="Double tap to create a new account"
            >
              <Text style={styles.linkText}>
                Don't have an account? Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16
  },
  loginButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  linkText: {
    color: '#1E88E5',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16
  }
});
