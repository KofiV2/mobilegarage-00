import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock Firebase Auth
const mockOnAuthStateChanged = vi.fn();
const mockSignInWithPhoneNumber = vi.fn();
const mockSignOut = vi.fn();
const mockConfirmationResultConfirm = vi.fn();

vi.mock('firebase/auth', () => {
  return {
    onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
    signInWithPhoneNumber: (...args) => mockSignInWithPhoneNumber(...args),
    signOut: (...args) => mockSignOut(...args),
    RecaptchaVerifier: class MockRecaptchaVerifier {
      constructor() {}
      clear() {}
    },
  };
});

// Mock Firebase Firestore
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockWriteBatch = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: (...args) => mockGetDocs(...args),
  writeBatch: (...args) => mockWriteBatch(...args),
  serverTimestamp: vi.fn(() => new Date()),
  deleteField: vi.fn(() => ({})),
}));

// Mock Firebase config
vi.mock('../firebase/config', () => ({
  auth: {},
  db: {},
}));

// Mock secureSession utilities
vi.mock('../utils/secureSession', () => ({
  storeSecureSession: vi.fn(),
  getSecureSession: vi.fn(),
  removeSecureSession: vi.fn(),
  isSessionExpired: vi.fn(),
  generateSessionId: vi.fn(() => 'mock-session-id-12345'),
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Test component that uses auth context
const TestAuthConsumer = ({ onAuthState }) => {
  const auth = useAuth();

  React.useEffect(() => {
    if (onAuthState) {
      onAuthState(auth);
    }
  }, [auth, onAuthState]);

  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="isGuest">{String(auth.isGuest)}</div>
      {auth.user && <div data-testid="userId">{auth.user.uid}</div>}
      {auth.userData && <div data-testid="userName">{auth.userData.name}</div>}
      <button data-testid="logout" onClick={auth.logout}>
        Logout
      </button>
      <button data-testid="enterGuest" onClick={auth.enterGuestMode}>
        Enter Guest Mode
      </button>
      <button data-testid="exitGuest" onClick={auth.exitGuestMode}>
        Exit Guest Mode
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.recaptchaVerifier = null;

    // Default mock implementations
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Default: no user
      callback(null);
      return vi.fn(); // unsubscribe
    });

    mockSignOut.mockResolvedValue();
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });
    mockSetDoc.mockResolvedValue();
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    mockWriteBatch.mockReturnValue({
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Initial State', () => {
    it('should start with loading true', async () => {
      // Don't call the callback immediately
      mockOnAuthStateChanged.mockImplementation(() => vi.fn());

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      // Loading should still be true since callback hasn't been called
      expect(screen.getByTestId('loading').textContent).toBe('true');
    });

    it('should set loading false after auth state check', async () => {
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should not be authenticated without user', async () => {
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });

    it('should not be guest by default', async () => {
      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isGuest').textContent).toBe('false');
      });
    });
  });

  describe('User Authentication', () => {
    it('should set user when Firebase returns authenticated user', async () => {
      const mockUser = {
        uid: 'test-user-123',
        phoneNumber: '+971501234567',
      };

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('userId').textContent).toBe('test-user-123');
      });
    });

    it('should fetch user data from Firestore when authenticated', async () => {
      const mockUser = {
        uid: 'test-user-123',
        phoneNumber: '+971501234567',
      };

      const mockUserData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+971501234567',
      };

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('userName').textContent).toBe('Test User');
      });
    });
  });

  describe('Guest Mode', () => {
    it('should enter guest mode', async () => {
      const user = userEvent.setup();
      const { getSecureSession, storeSecureSession } = await import('../utils/secureSession');
      getSecureSession.mockResolvedValue(null);
      storeSecureSession.mockResolvedValue();

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await user.click(screen.getByTestId('enterGuest'));

      await waitFor(() => {
        expect(screen.getByTestId('isGuest').textContent).toBe('true');
      });
    });

    it('should exit guest mode', async () => {
      const user = userEvent.setup();
      const { getSecureSession, storeSecureSession, removeSecureSession } = await import('../utils/secureSession');
      getSecureSession.mockResolvedValue(null);
      storeSecureSession.mockResolvedValue();

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Enter guest mode
      await user.click(screen.getByTestId('enterGuest'));

      await waitFor(() => {
        expect(screen.getByTestId('isGuest').textContent).toBe('true');
      });

      // Exit guest mode
      await user.click(screen.getByTestId('exitGuest'));

      await waitFor(() => {
        expect(screen.getByTestId('isGuest').textContent).toBe('false');
      });

      expect(removeSecureSession).toHaveBeenCalled();
    });

    it('should restore guest session from storage on mount', async () => {
      const { getSecureSession, isSessionExpired } = await import('../utils/secureSession');

      getSecureSession.mockResolvedValue({
        sessionId: 'stored-guest-session',
        expiry: Date.now() + 3600000,
        createdAt: Date.now(),
      });
      isSessionExpired.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isGuest').textContent).toBe('true');
      });
    });

    it('should clear expired guest session', async () => {
      const { getSecureSession, isSessionExpired, removeSecureSession } = await import('../utils/secureSession');

      getSecureSession.mockResolvedValue({
        sessionId: 'expired-session',
        expiry: Date.now() - 1000,
        createdAt: Date.now() - 100000,
      });
      isSessionExpired.mockReturnValue(true);

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isGuest').textContent).toBe('false');
      });

      expect(removeSecureSession).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    it('should clear user on logout', async () => {
      const user = userEvent.setup();

      const mockUser = {
        uid: 'test-user-123',
        phoneNumber: '+971501234567',
      };

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });

      mockSignOut.mockResolvedValue();

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      await user.click(screen.getByTestId('logout'));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestAuthConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('Auth Context Values', () => {
    it('should provide all expected context values', async () => {
      let capturedAuth;

      render(
        <AuthProvider>
          <TestAuthConsumer onAuthState={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth).toBeDefined();
      });

      // Check all expected properties exist
      expect(capturedAuth).toHaveProperty('user');
      expect(capturedAuth).toHaveProperty('userData');
      expect(capturedAuth).toHaveProperty('loading');
      expect(capturedAuth).toHaveProperty('sendOTP');
      expect(capturedAuth).toHaveProperty('verifyOTP');
      expect(capturedAuth).toHaveProperty('updateUserProfile');
      expect(capturedAuth).toHaveProperty('logout');
      expect(capturedAuth).toHaveProperty('demoLogin');
      expect(capturedAuth).toHaveProperty('isAuthenticated');
      expect(capturedAuth).toHaveProperty('isDemoMode');
      expect(capturedAuth).toHaveProperty('isGuest');
      expect(capturedAuth).toHaveProperty('enterGuestMode');
      expect(capturedAuth).toHaveProperty('exitGuestMode');
      expect(capturedAuth).toHaveProperty('validateGuestSession');
      expect(capturedAuth).toHaveProperty('getGuestSessionId');
      expect(capturedAuth).toHaveProperty('getRateLimitRemaining');

      // Check types
      expect(typeof capturedAuth.sendOTP).toBe('function');
      expect(typeof capturedAuth.verifyOTP).toBe('function');
      expect(typeof capturedAuth.updateUserProfile).toBe('function');
      expect(typeof capturedAuth.logout).toBe('function');
      expect(typeof capturedAuth.enterGuestMode).toBe('function');
      expect(typeof capturedAuth.exitGuestMode).toBe('function');
      expect(typeof capturedAuth.validateGuestSession).toBe('function');
      expect(typeof capturedAuth.loading).toBe('boolean');
      expect(typeof capturedAuth.isAuthenticated).toBe('boolean');
      expect(typeof capturedAuth.isGuest).toBe('boolean');
    });
  });

  describe('OTP Flow', () => {
    it('should call signInWithPhoneNumber when sending OTP', async () => {
      let capturedAuth;

      mockSignInWithPhoneNumber.mockResolvedValue({
        confirm: mockConfirmationResultConfirm,
      });

      render(
        <AuthProvider>
          <TestAuthConsumer onAuthState={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth).toBeDefined();
      });

      await act(async () => {
        await capturedAuth.sendOTP('+971501234567', 'recaptcha-container');
      });

      expect(mockSignInWithPhoneNumber).toHaveBeenCalled();
    });

    it('should return error for rate-limited requests', async () => {
      let capturedAuth;

      // Simulate rate limiting
      const rateLimitError = new Error('Too many requests');
      rateLimitError.code = 'auth/too-many-requests';
      mockSignInWithPhoneNumber.mockRejectedValueOnce(rateLimitError);

      render(
        <AuthProvider>
          <TestAuthConsumer onAuthState={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth).toBeDefined();
      });

      let result;
      await act(async () => {
        result = await capturedAuth.sendOTP('+971501234567', 'recaptcha-container');
      });

      expect(result.success).toBe(false);
      // Error message may contain "Too many" or be the rate limit message
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    });
  });

  describe('Profile Update', () => {
    it('should update user profile when authenticated', async () => {
      let capturedAuth;

      const mockUser = {
        uid: 'test-user-123',
        phoneNumber: '+971501234567',
      };

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'Original Name' }),
      });

      mockSetDoc.mockResolvedValue();

      render(
        <AuthProvider>
          <TestAuthConsumer onAuthState={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth?.isAuthenticated).toBe(true);
      });

      const updateData = { name: 'Updated Name', email: 'new@example.com' };

      let result;
      await act(async () => {
        result = await capturedAuth.updateUserProfile(updateData);
      });

      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should return error when updating profile without authentication', async () => {
      let capturedAuth;

      render(
        <AuthProvider>
          <TestAuthConsumer onAuthState={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth?.loading).toBe(false);
      });

      let result;
      await act(async () => {
        result = await capturedAuth.updateUserProfile({ name: 'Test' });
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });

  describe('Demo Mode', () => {
    it('should login with demo user', async () => {
      let capturedAuth;

      render(
        <AuthProvider>
          <TestAuthConsumer onAuthState={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth).toBeDefined();
      });

      await act(async () => {
        capturedAuth.demoLogin();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('userId').textContent).toBe('demo-user-123');
      });
    });
  });

  describe('Guest Session Validation', () => {
    it('should validate active guest session', async () => {
      const { getSecureSession, isSessionExpired, storeSecureSession } = await import('../utils/secureSession');

      getSecureSession.mockResolvedValue(null);
      storeSecureSession.mockResolvedValue();
      isSessionExpired.mockReturnValue(false);

      let capturedAuth;

      render(
        <AuthProvider>
          <TestAuthConsumer onAuthState={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth).toBeDefined();
      });

      // Enter guest mode
      await act(async () => {
        await capturedAuth.enterGuestMode();
      });

      // Now mock the session check
      getSecureSession.mockResolvedValue({
        sessionId: 'mock-session-id-12345',
        expiry: Date.now() + 3600000,
      });

      let validationResult;
      await act(async () => {
        validationResult = await capturedAuth.validateGuestSession();
      });

      expect(validationResult.valid).toBe(true);
    });

    it('should return invalid for non-guest users', async () => {
      let capturedAuth;

      render(
        <AuthProvider>
          <TestAuthConsumer onAuthState={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth).toBeDefined();
      });

      let validationResult;
      await act(async () => {
        validationResult = await capturedAuth.validateGuestSession();
      });

      expect(validationResult.valid).toBe(false);
      expect(validationResult.reason).toBe('not_guest');
    });
  });

  describe('Rate Limit Tracking', () => {
    it('should return 0 when not rate limited', async () => {
      let capturedAuth;

      render(
        <AuthProvider>
          <TestAuthConsumer onAuthState={(auth) => { capturedAuth = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(capturedAuth).toBeDefined();
      });

      expect(capturedAuth.getRateLimitRemaining()).toBe(0);
    });
  });
});
