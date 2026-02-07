import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './Toast.css';

/**
 * Toast Notification System
 *
 * Provides a global toast notification system for user feedback.
 *
 * Usage:
 * 1. Wrap your app with ToastProvider:
 *    <ToastProvider><App /></ToastProvider>
 *
 * 2. Use the useToast hook in any component:
 *    const { showToast } = useToast();
 *    showToast('Success!', 'success');
 *    showToast('Error occurred', 'error');
 *    showToast('Warning message', 'warning');
 *    showToast('Information', 'info');
 *
 * Features:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Manual dismiss
 * - Stacked toasts
 * - Smooth animations
 * - Accessible (ARIA labels, keyboard support)
 */

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children, maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };

    setToasts(prevToasts => {
      const updatedToasts = [...prevToasts, newToast];
      // Limit number of toasts
      return updatedToasts.slice(-maxToasts);
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
  maxToasts: PropTypes.number
};

const ToastContainer = ({ toasts, removeToast }) => {
  // Always render the container with aria-live so screen readers can track changes
  return (
    <div 
      className={`toast-container ${toasts.length === 0 ? 'toast-container-empty' : ''}`}
      role="region" 
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
      duration: PropTypes.number
    })
  ).isRequired,
  removeToast: PropTypes.func.isRequired
};

const Toast = ({ id, message, type, onClose }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const ariaLabels = {
    success: 'Success notification',
    error: 'Error notification',
    warning: 'Warning notification',
    info: 'Information notification'
  };

  return (
    <div
      className={`toast toast-${type}`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-label={ariaLabels[type]}
    >
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-message">{message}</div>
      <button
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
        type="button"
      >
        ✕
      </button>
    </div>
  );
};

Toast.propTypes = {
  id: PropTypes.number.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
  onClose: PropTypes.func.isRequired
};

export default Toast;
