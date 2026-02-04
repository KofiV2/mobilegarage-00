import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { PACKAGES_LIST } from '../config/packages';
import './AuthPage.css';

const AuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sendOTP, verifyOTP, isAuthenticated, isGuest, loading, demoLogin, isDemoMode, enterGuestMode, getRateLimitRemaining } = useAuth();

  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  // Redirect if already in guest mode (e.g., returning to auth page while guest)
  useEffect(() => {
    if (!loading && isGuest) {
      navigate('/services');
    }
  }, [isGuest, loading, navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setTimeout(() => setRateLimitCountdown(rateLimitCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitCountdown]);

  // Format phone number for display
  const formatPhoneInput = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 9 digits (UAE mobile without country code)
    return digits.slice(0, 9);
  };

  // Validate UAE mobile number (must be 9 digits starting with 5)
  const isValidUAEMobile = (phone) => {
    return phone.length === 9 && phone.startsWith('5');
  };

  // Handle phone submit
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // UAE mobile numbers: 9 digits, must start with 5
    if (!isValidUAEMobile(phoneNumber)) {
      setError(t('auth.invalidPhone'));
      return;
    }

    setIsSubmitting(true);
    const fullNumber = `+971${phoneNumber}`;
    const result = await sendOTP(fullNumber);

    if (result.success) {
      setStep('otp');
      setCountdown(60);
      setRateLimitCountdown(0);
    } else {
      setError(result.error || t('auth.otpSendError'));
      // If rate limited, start countdown
      if (result.rateLimitRemaining) {
        setRateLimitCountdown(result.rateLimitRemaining);
      }
    }
    setIsSubmitting(false);
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      digits.split('').forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      // Focus last filled or next empty
      const nextIndex = Math.min(index + digits.length, 5);
      document.getElementById(`otp-${nextIndex}`)?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, '');
      setOtp(newOtp);
      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Handle OTP submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const code = otp.join('');
    if (code.length !== 6) {
      setError(t('auth.invalidOtp'));
      return;
    }

    setIsSubmitting(true);
    const result = await verifyOTP(code);

    if (result.success) {
      if (result.isNewUser) {
        navigate('/profile/edit', { state: { isNewUser: true } });
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || t('auth.otpVerifyError'));
    }
    setIsSubmitting(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setError('');
    setIsSubmitting(true);
    const fullNumber = `+971${phoneNumber}`;
    const result = await sendOTP(fullNumber);

    if (result.success) {
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setRateLimitCountdown(0);
    } else {
      setError(result.error || t('auth.otpSendError'));
      // If rate limited, start countdown
      if (result.rateLimitRemaining) {
        setRateLimitCountdown(result.rateLimitRemaining);
      }
    }
    setIsSubmitting(false);
  };

  // Go back to phone step
  const handleBack = () => {
    setStep('phone');
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  // Continue as guest - use callback to ensure navigation happens after state update
  const handleGuestLogin = useCallback(async () => {
    if (isDemoMode) {
      demoLogin();
      navigate('/services');
    } else {
      // enterGuestMode is async (uses secure session signing)
      const result = await enterGuestMode();
      if (result.success) {
        navigate('/services');
      }
    }
  }, [isDemoMode, demoLogin, enterGuestMode, navigate]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container"></div>

      <div className="auth-container">
        {/* Logo */}
        <div className="auth-logo">
          <img
            src="/logo.png"
            alt="3ON Mobile Carwash"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="auth-logo-fallback" style={{ display: 'none' }}>
            <span className="logo-icon">🚗</span>
            <span className="logo-text">3ON</span>
          </div>
        </div>

        {/* Packages Preview */}
        {step === 'phone' && (
          <div className="auth-packages">
            <h2 className="auth-packages-title">{t('services.title')}</h2>
            <div className="auth-packages-list">
              {PACKAGES_LIST.map((pkg) => (
                <div key={pkg.id} className={`auth-package-item ${pkg.popular ? 'popular' : ''}`}>
                  {pkg.popular && (
                    <span className="auth-popular-tag">{t('packages.mostPopular')}</span>
                  )}
                  <div className="auth-package-icon">{pkg.icon}</div>
                  <div className="auth-package-info">
                    <h4 className="auth-package-name">{t(`packages.${pkg.id}.name`)}</h4>
                    <div className="auth-package-prices">
                      <span>{t('packages.sedan')} AED {pkg.sedanPrice}</span>
                      <span>{t('packages.suv')} AED {pkg.suvPrice}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h1 className="auth-title">
          {step === 'phone' ? t('auth.welcomeBack') : t('auth.verifyPhone')}
        </h1>
        <p className="auth-subtitle">
          {step === 'phone' ? t('auth.enterPhone') : t('auth.enterOtp')}
        </p>

        {/* Phone Step */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="auth-form">
            <div className="phone-input-group">
              <div className="phone-prefix">
                <span className="uae-flag">🇦🇪</span>
                <span className="prefix-code">+971</span>
              </div>
              <input
                type="tel"
                className="phone-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                placeholder="5X XXX XXXX"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            {error && <p className="auth-error">{error}</p>}
            {rateLimitCountdown > 0 && (
              <div className="rate-limit-countdown">
                <span className="countdown-icon">⏱️</span>
                <span>{t('auth.rateLimitWait', { seconds: rateLimitCountdown })}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-btn"
              disabled={isSubmitting || phoneNumber.length !== 9 || rateLimitCountdown > 0}
            >
              {isSubmitting ? (
                <span className="btn-loading">
                  <span className="spinner-small"></span>
                  {t('auth.sending')}
                </span>
              ) : (
                t('auth.continue')
              )}
            </button>

            <div className="auth-divider">
              <span>{t('auth.or')}</span>
            </div>

            <button
              type="button"
              className="guest-btn"
              onClick={handleGuestLogin}
            >
              {t('auth.continueAsGuest')}
            </button>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="auth-form">
            <button type="button" className="back-btn" onClick={handleBack}>
              ← {t('auth.changeNumber')}
            </button>

            <p className="phone-display">+971 {phoneNumber}</p>

            <div className="otp-input-group">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  autoFocus={index === 0}
                  disabled={isSubmitting}
                />
              ))}
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="auth-btn"
              disabled={isSubmitting || otp.join('').length !== 6}
            >
              {isSubmitting ? (
                <span className="btn-loading">
                  <span className="spinner-small"></span>
                  {t('auth.verifying')}
                </span>
              ) : (
                t('auth.verify')
              )}
            </button>

            <button
              type="button"
              className="resend-btn"
              onClick={handleResendOtp}
              disabled={countdown > 0 || isSubmitting}
            >
              {countdown > 0 ? (
                `${t('auth.resendIn')} ${countdown}s`
              ) : (
                t('auth.resendOtp')
              )}
            </button>
          </form>
        )}

        <p className="auth-terms">
          {t('auth.termsText')}{' '}
          <a href="/terms">{t('auth.termsLink')}</a>{' '}
          {t('auth.and')}{' '}
          <a href="/privacy">{t('auth.privacyLink')}</a>
        </p>

        {/* Language Switcher - Bottom */}
        <div className="auth-lang-switcher-bottom">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
