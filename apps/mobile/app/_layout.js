import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { RTLProvider } from '../context/RTLContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useRouter } from 'expo-router';

function RootLayoutContent() {
  const router = useRouter();

  const handleErrorRetry = () => {
    // Reload the current route
    router.replace('/');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <ErrorBoundary
      onRetry={handleErrorRetry}
      onGoHome={handleGoHome}
      showHomeButton={true}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          // Accessibility improvements
          animation: 'default',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerAccessibilityLabel: 'Welcome screen',
          }}
        />
        <Stack.Screen
          name="(auth)"
          options={{
            headerAccessibilityLabel: 'Authentication screens',
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerAccessibilityLabel: 'Main app screens',
          }}
        />
      </Stack>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
    >
      <RTLProvider>
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </RTLProvider>
    </StripeProvider>
  );
}
