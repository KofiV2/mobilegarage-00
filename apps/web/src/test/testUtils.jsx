import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../components/Toast';
import { ConfirmDialogProvider } from '../components/ConfirmDialog';

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui,
  {
    initialAuthState = { user: null, isAuthenticated: false, loading: false },
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <ToastProvider>
          <ConfirmDialogProvider>
            <AuthProvider initialState={initialAuthState}>
              {children}
            </AuthProvider>
          </ConfirmDialogProvider>
        </ToastProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock user data for testing
 */
export const mockUser = {
  uid: 'test-user-123',
  phoneNumber: '+971501234567',
  displayName: 'Test User',
};

export const mockUserData = {
  id: 'test-user-123',
  name: 'Test User',
  phoneNumber: '+971501234567',
  email: 'test@example.com',
  language: 'en',
  loyaltyPoints: 5,
  totalBookings: 10,
  createdAt: new Date('2024-01-01'),
};

/**
 * Mock booking data for testing
 */
export const mockBooking = {
  id: 'booking-123',
  userId: 'test-user-123',
  packageName: 'premium',
  vehicleType: 'sedan',
  price: 150,
  address: '123 Test Street, Dubai',
  phoneNumber: '+971501234567',
  status: 'pending',
  createdAt: new Date('2024-01-15'),
  scheduledDate: new Date('2024-01-20'),
  scheduledTime: '10:00',
};

/**
 * Mock loyalty data for testing
 */
export const mockLoyalty = {
  washCount: 3,
  freeWashAvailable: false,
  lastUpdated: new Date('2024-01-15'),
};

/**
 * Wait for a condition to be true
 */
export async function waitFor(callback, options = {}) {
  const { timeout = 3000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = callback();
      if (result) return result;
    } catch (error) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for condition');
}

/**
 * Create mock functions for Firebase operations
 */
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
};

/**
 * Create mock functions for Auth context
 */
export const mockAuthContext = {
  user: mockUser,
  userData: mockUserData,
  isAuthenticated: true,
  loading: false,
  sendOTP: vi.fn(),
  verifyOTP: vi.fn(),
  logout: vi.fn(),
  updateUserProfile: vi.fn(),
};

/**
 * Create mock functions for Toast
 */
export const mockToast = {
  showToast: vi.fn(),
  removeToast: vi.fn(),
  clearAllToasts: vi.fn(),
};

/**
 * Create mock functions for ConfirmDialog
 */
export const mockConfirm = {
  confirm: vi.fn(() => Promise.resolve(true)),
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
