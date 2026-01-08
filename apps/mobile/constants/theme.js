// In and Out Car Wash - Modern Theme
export const COLORS = {
  // Primary Brand Colors
  primary: '#FF6B35',        // Vibrant Orange (main brand color)
  primaryDark: '#E85A2A',    // Darker orange for hover/active states
  primaryLight: '#FF8C66',   // Lighter orange for backgrounds

  // Secondary Colors
  secondary: '#004E89',      // Deep Blue (professionalism)
  secondaryDark: '#003D6B',  // Darker blue
  secondaryLight: '#1A6DAA', // Lighter blue

  // Accent Colors
  accent: '#00D9FF',         // Bright Cyan (modern, clean)
  accentDark: '#00B8D9',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8F9FA',
  surface: '#FFFFFF',

  // Grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Status Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Text - Updated for better WCAG AA contrast
  textPrimary: '#111827',      // Main text - high contrast
  textSecondary: '#4B5563',    // Secondary text - passes WCAG AA (was #6B7280)
  textTertiary: '#6B7280',     // Tertiary text - minimum viable contrast (was #9CA3AF)
  textWhite: '#FFFFFF',
  placeholderText: '#666666',  // Accessible placeholder color (4.59:1 contrast)

  // Gradients
  gradientPrimary: ['#FF6B35', '#E85A2A'],
  gradientSecondary: ['#004E89', '#00D9FF'],
  gradientLight: ['#FF8C66', '#FFA88A'],
};

export const SIZES = {
  // App Dimensions
  base: 8,

  // Font Sizes - Updated for accessibility (minimum 14px for body text)
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  h6: 16,
  body: 16,     // Increased from 14 for better readability
  caption: 14,  // Increased from 12 (meets minimum accessibility standard)
  tiny: 12,     // Increased from 10 (should be used sparingly)

  // Minimum touch target size (WCAG 2.5.5)
  minTouchTarget: 48,

  // Spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // Border Radius
  radiusXs: 4,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 9999,

  // Icons
  iconXs: 16,
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 48,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  semiBold: 'System',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default {
  COLORS,
  SIZES,
  FONTS,
  SHADOWS,
};
