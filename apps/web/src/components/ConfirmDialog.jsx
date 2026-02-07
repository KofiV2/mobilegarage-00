import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import './ConfirmDialog.css';

/**
 * Confirmation Dialog System
 *
 * Provides a global confirmation dialog for critical user actions.
 *
 * Usage:
 * 1. Wrap your app with ConfirmDialogProvider:
 *    <ConfirmDialogProvider><App /></ConfirmDialogProvider>
 *
 * 2. Use the useConfirm hook in any component:
 *    const { confirm } = useConfirm();
 *
 *    const handleDelete = async () => {
 *      const confirmed = await confirm({
 *        title: 'Delete Item',
 *        message: 'Are you sure you want to delete this item?',
 *        confirmText: 'Delete',
 *        cancelText: 'Cancel',
 *        variant: 'danger'
 *      });
 *
 *      if (confirmed) {
 *        // Proceed with deletion
 *      }
 *    };
 *
 * Features:
 * - Promise-based API
 * - Multiple variants (danger, warning, info)
 * - Customizable buttons
 * - Keyboard support (Enter/Escape)
 * - Accessible (ARIA labels, focus management)
 * - Backdrop click to cancel
 */

const ConfirmDialogContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
};

export const ConfirmDialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'info',
    onConfirm: null,
    onCancel: null
  });

  const confirm = useCallback(
    ({
      title = 'Confirm Action',
      message = 'Are you sure you want to proceed?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'info'
    }) => {
      return new Promise((resolve) => {
        setDialogState({
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          variant,
          onConfirm: () => {
            setDialogState(prev => ({ ...prev, isOpen: false }));
            resolve(true);
          },
          onCancel: () => {
            setDialogState(prev => ({ ...prev, isOpen: false }));
            resolve(false);
          }
        });
      });
    },
    []
  );

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog {...dialogState} />
    </ConfirmDialogContext.Provider>
  );
};

ConfirmDialogProvider.propTypes = {
  children: PropTypes.node.isRequired
};

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  variant,
  onConfirm,
  onCancel
}) => {
  // Use focus trap for accessibility
  const dialogRef = useFocusTrap(isOpen, {
    autoFocus: true,
    restoreFocus: true,
    initialFocusSelector: '.btn-cancel' // Focus cancel button by default (safer)
  });

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel?.();
    } else if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'BUTTON') {
      // Only trigger on Enter if not already on a button (let buttons handle their own clicks)
      e.preventDefault();
      onConfirm?.();
    }
  }, [onCancel, onConfirm]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onCancel?.();
    }
  }, [onCancel]);

  // Add escape key listener to document
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantIcons = {
    danger: '⚠️',
    warning: '⚠',
    info: 'ℹ️'
  };

  const variantLabels = {
    danger: 'Warning',
    warning: 'Caution',
    info: 'Information'
  };

  return (
    <div
      className="confirm-dialog-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        className={`confirm-dialog confirm-dialog-${variant}`}
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        aria-modal="true"
      >
        <div className="confirm-dialog-icon" aria-hidden="true">
          {variantIcons[variant]}
        </div>

        {/* Screen reader only: announce dialog type */}
        <span className="sr-only">{variantLabels[variant]} dialog:</span>

        <h2 id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h2>

        <p id="confirm-dialog-message" className="confirm-dialog-message">
          {message}
        </p>

        <div className="confirm-dialog-actions" role="group" aria-label="Dialog actions">
          <button
            onClick={onCancel}
            className="btn-cancel"
            type="button"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn-confirm btn-confirm-${variant}`}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string.isRequired,
  cancelText: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['danger', 'warning', 'info']).isRequired,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func
};

export default ConfirmDialog;
