import React, { createContext, useContext, useState, useCallback, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { getUserFriendlyError, isRetryableError } from '../utils/errorRecovery';
import './ErrorRecoveryToast.css';

/**
 * ErrorRecoveryToast Component
 * 
 * Displays an error message with optional retry and dismiss actions.
 * Use this for recoverable errors where the user can retry the operation.
 * 
 * Usage (Standalone):
 * <ErrorRecoveryToast
 *   error={{ message: 'Failed to save', code: 'save-failed' }}
 *   onRetry={() => handleSave()}
 *   onDismiss={() => setError(null)}
 * />
 * 
 * Usage (With Provider):
 * 1. Wrap your app with ErrorRecoveryToastProvider:
 *    <ErrorRecoveryToastProvider><App /></ErrorRecoveryToastProvider>
 * 
 * 2. Use the useErrorRecoveryToast hook:
 *    const { showError, showErrorWithRetry, clearErrors } = useErrorRecoveryToast();
 *    showErrorWithRetry(error, async () => await fetchData());
 */

// ============================================
// Context-Based Provider System
// ============================================

const ErrorRecoveryToastContext = createContext(null);

export const useErrorRecoveryToast = () => {
  const context = useContext(ErrorRecoveryToastContext);
  if (!context) {
    throw new Error('useErrorRecoveryToast must be used within an ErrorRecoveryToastProvider');
  }
  return context;
};

export const ErrorRecoveryToastProvider = ({ children, maxToasts = 3 }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showError = useCallback((error, options = {}) => {
    const {
      duration = 8000,
      title = 'Error',
      showDetails = false
    } = options;

    const id = ++toastIdRef.current;
    const message = getUserFriendlyError(error);
    const canRetry = isRetryableError(error);

    const newToast = {
      id,
      title,
      message,
      originalError: error,
      showDetails,
      canRetry,
      retryFn: null,
      isRetrying: false,
      retryCount: 0
    };

    setToasts(prev => [...prev.slice(-(maxToasts - 1)), newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [maxToasts, removeToast]);

  const showErrorWithRetry = useCallback((error, retryFn, options = {}) => {
    const {
      duration = 0,
      title = 'Error',
      showDetails = false,
      maxRetries = 3
    } = options;

    const id = ++toastIdRef.current;
    const message = getUserFriendlyError(error);

    const newToast = {
      id,
      title,
      message,
      originalError: error,
      showDetails,
      canRetry: true,
      retryFn,
      isRetrying: false,
      retryCount: 0,
      maxRetries
    };

    setToasts(prev => [...prev.slice(-(maxToasts - 1)), newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [maxToasts, removeToast]);

  const handleRetry = useCallback(async (id) => {
    const toast = toasts.find(t => t.id === id);
    if (!toast?.retryFn) return;

    setToasts(prev => prev.map(t => 
      t.id === id ? { ...t, isRetrying: true } : t
    ));

    try {
      await toast.retryFn();
      removeToast(id);
    } catch (error) {
      setToasts(prev => prev.map(t => 
        t.id === id 
          ? { 
              ...t, 
              isRetrying: false, 
              retryCount: t.retryCount + 1,
              message: getUserFriendlyError(error),
              canRetry: t.retryCount + 1 < (t.maxRetries || 3)
            }
          : t
      ));
    }
  }, [toasts, removeToast]);

  const clearErrors = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ErrorRecoveryToastContext.Provider value={{ 
      showError, 
      showErrorWithRetry, 
      removeToast, 
      clearErrors 
    }}>
      {children}
      <ErrorRecoveryToastContainer 
        toasts={toasts} 
        onClose={removeToast}
        onRetry={handleRetry}
      />
    </ErrorRecoveryToastContext.Provider>
  );
};

ErrorRecoveryToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
  maxToasts: PropTypes.number
};

const ErrorRecoveryToastContainer = ({ toasts, onClose, onRetry }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="error-recovery-container" role="region" aria-label="Error notifications">
      {toasts.map(toast => (
        <ErrorRecoveryToastItem 
          key={toast.id} 
          toast={toast}
          onClose={() => onClose(toast.id)}
          onRetry={() => onRetry(toast.id)}
        />
      ))}
    </div>
  );
};

ErrorRecoveryToastContainer.propTypes = {
  toasts: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired
};

const ErrorRecoveryToastItem = ({ toast, onClose, onRetry }) => {
  const { t } = useTranslation();
  const { 
    title, 
    message, 
    originalError, 
    showDetails, 
    canRetry, 
    isRetrying,
    retryCount,
    maxRetries = 3
  } = toast;

  const retriesLeft = maxRetries - retryCount;

  return (
    <div 
      className={`error-recovery-toast-item ${isRetrying ? 'retrying' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-recovery-icon">
        {isRetrying ? (
          <div className="retry-spinner" aria-label={t('common.retrying') || 'Retrying...'} />
        ) : (
          <span>⚠️</span>
        )}
      </div>
      
      <div className="error-recovery-content">
        <div className="error-recovery-title">{title}</div>
        <div className="error-recovery-message">{message}</div>
        
        {showDetails && originalError?.message && (
          <details className="error-recovery-details">
            <summary>{t('common.technicalDetails') || 'Technical details'}</summary>
            <code>{originalError.message}</code>
          </details>
        )}

        {retryCount > 0 && canRetry && (
          <div className="error-recovery-retry-info">
            {t('common.attemptOf', { current: retryCount + 1, max: maxRetries }) || 
              `Attempt ${retryCount + 1} of ${maxRetries}`}
          </div>
        )}
      </div>

      <div className="error-recovery-actions">
        {canRetry && toast.retryFn && (
          <button
            className="error-recovery-retry-btn"
            onClick={onRetry}
            disabled={isRetrying}
            aria-label={isRetrying ? (t('common.retrying') || 'Retrying...') : 
              `${t('common.retry') || 'Retry'} (${retriesLeft} ${t('common.attemptsLeft') || 'attempts left'})`}
          >
            {isRetrying ? (t('common.retrying') || 'Retrying...') : (t('common.retry') || 'Retry')}
          </button>
        )}
        
        <button
          className="error-recovery-close-btn"
          onClick={onClose}
          aria-label={t('common.dismiss') || 'Dismiss error'}
          disabled={isRetrying}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

ErrorRecoveryToastItem.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    originalError: PropTypes.object,
    showDetails: PropTypes.bool,
    canRetry: PropTypes.bool,
    retryFn: PropTypes.func,
    isRetrying: PropTypes.bool,
    retryCount: PropTypes.number,
    maxRetries: PropTypes.number
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired
};

// ============================================
// Standalone Component (Original)
// ============================================

const ErrorRecoveryToast = memo(function ErrorRecoveryToast({
  error,
  onRetry,
  onDismiss,
  retryLabel,
  dismissLabel,
  showIcon = true,
  autoHide = false,
  autoHideDelay = 10000
}) {
  const { t } = useTranslation();

  // Auto-hide after delay if enabled
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  if (!error) return null;

  const errorMessage = typeof error === 'string' 
    ? error 
    : error.userMessage || error.message || t('errors.somethingWentWrong') || 'Something went wrong';

  return (
    <div className="error-recovery-toast" role="alert" aria-live="polite">
      <div className="error-recovery-content">
        {showIcon && (
          <span className="error-recovery-icon" aria-hidden="true">
            ⚠️
          </span>
        )}
        <div className="error-recovery-message">
          {errorMessage}
        </div>
      </div>
      <div className="error-recovery-actions">
        {onRetry && (
          <button 
            onClick={onRetry} 
            className="error-recovery-btn error-recovery-btn-retry"
            type="button"
          >
            {retryLabel || t('common.tryAgain') || 'Try Again'}
          </button>
        )}
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="error-recovery-btn error-recovery-btn-dismiss"
            type="button"
            aria-label={dismissLabel || t('common.dismiss') || 'Dismiss'}
          >
            {dismissLabel || t('common.dismiss') || 'Dismiss'}
          </button>
        )}
      </div>
    </div>
  );
});

ErrorRecoveryToast.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      message: PropTypes.string,
      userMessage: PropTypes.string,
      code: PropTypes.string
    })
  ]),
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func,
  retryLabel: PropTypes.string,
  dismissLabel: PropTypes.string,
  showIcon: PropTypes.bool,
  autoHide: PropTypes.bool,
  autoHideDelay: PropTypes.number
};

// ============================================
// Inline Error Recovery Component
// ============================================

export const InlineErrorRecovery = memo(function InlineErrorRecovery({
  error,
  onRetry,
  onDismiss
}) {
  const { t } = useTranslation();

  if (!error) return null;

  const errorMessage = typeof error === 'string' 
    ? error 
    : error.userMessage || error.message;

  return (
    <div className="inline-error-recovery" role="alert">
      <span className="inline-error-message">{errorMessage}</span>
      <div className="inline-error-actions">
        {onRetry && (
          <button 
            onClick={onRetry} 
            className="inline-error-btn"
            type="button"
          >
            {t('common.retry') || 'Retry'}
          </button>
        )}
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="inline-error-close"
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
});

InlineErrorRecovery.propTypes = {
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func
};

// ============================================
// Hook for managing error state with recovery
// ============================================

export const useErrorRecovery = (initialError = null) => {
  const [error, setError] = React.useState(initialError);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = React.useCallback(async (retryFn) => {
    setIsRetrying(true);
    try {
      await retryFn();
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsRetrying(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    clearError,
    isRetrying,
    handleRetry
  };
};

export default ErrorRecoveryToast;
