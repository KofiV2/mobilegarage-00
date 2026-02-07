/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */
import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console in development
    if (__DEV__) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
    
    // You could send this to an error reporting service
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={64} color={COLORS.error} />
            </View>
            
            <Text
              style={styles.title}
              accessibilityRole="header"
              accessibilityLabel="Something went wrong"
            >
              Oops! Something went wrong
            </Text>
            
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.stackTrace}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              accessibilityHint="Reload the content"
            >
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {this.props.showHomeButton && (
              <TouchableOpacity
                style={styles.homeButton}
                onPress={this.props.onGoHome}
                accessibilityRole="button"
                accessibilityLabel="Go to home"
                accessibilityHint="Navigate to home screen"
              >
                <Text style={styles.homeButtonText}>Go to Home</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Error View Component for displaying inline errors
 */
export function ErrorView({
  error,
  onRetry,
  title = 'Something went wrong',
  message,
  compact = false,
}) {
  const errorMessage = message || error?.message || 'An unexpected error occurred.';

  if (compact) {
    return (
      <View
        style={styles.compactError}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Error: ${errorMessage}`}
      >
        <Ionicons name="alert-circle" size={20} color={COLORS.error} />
        <Text style={styles.compactErrorText}>{errorMessage}</Text>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={styles.compactRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View
      style={styles.errorView}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="alert-circle" size={48} color={COLORS.error} />
      <Text
        style={styles.errorViewTitle}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Text style={styles.errorViewMessage}>{errorMessage}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.errorViewButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Ionicons name="refresh" size={18} color={COLORS.white} />
          <Text style={styles.errorViewButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Empty State Component
 */
export function EmptyState({
  icon = 'folder-open-outline',
  title = 'No data',
  message = 'Nothing to show here yet.',
  actionLabel,
  onAction,
}) {
  return (
    <View
      style={styles.emptyState}
      accessibilityLabel={`${title}. ${message}`}
    >
      <Ionicons name={icon} size={64} color={COLORS.gray400} />
      <Text
        style={styles.emptyTitle}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    alignItems: 'center',
    maxWidth: 400,
    ...SHADOWS.medium,
  },
  iconContainer: {
    marginBottom: SIZES.lg,
  },
  title: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  message: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xl,
    lineHeight: 22,
  },
  errorDetails: {
    maxHeight: 200,
    backgroundColor: COLORS.gray100,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  errorText: {
    fontSize: SIZES.caption,
    color: COLORS.error,
    fontFamily: 'monospace',
  },
  stackTrace: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
    marginTop: SIZES.sm,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.xl,
    borderRadius: SIZES.radiusMd,
    gap: SIZES.sm,
    minWidth: 48,
    minHeight: 48,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  homeButton: {
    marginTop: SIZES.md,
    padding: SIZES.sm,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },

  // Compact error styles
  compactError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SIZES.sm,
    borderRadius: SIZES.radiusSm,
    gap: SIZES.sm,
  },
  compactErrorText: {
    flex: 1,
    fontSize: SIZES.caption,
    color: COLORS.error,
  },
  compactRetry: {
    padding: SIZES.xs,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error view styles
  errorView: {
    alignItems: 'center',
    padding: SIZES.xl,
  },
  errorViewTitle: {
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
  },
  errorViewMessage: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  errorViewButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    gap: SIZES.xs,
    minWidth: 48,
    minHeight: 48,
  },
  errorViewButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },

  // Empty state styles
  emptyState: {
    alignItems: 'center',
    padding: SIZES.xl,
  },
  emptyTitle: {
    fontSize: SIZES.h5,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
  },
  emptyMessage: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  emptyAction: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActionText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
