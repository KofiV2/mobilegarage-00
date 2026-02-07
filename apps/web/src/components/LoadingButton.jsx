import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './LoadingButton.css';

/**
 * LoadingButton Component
 * 
 * A button that shows a loading spinner when an async action is in progress.
 * Prevents double-clicks and provides visual feedback.
 * 
 * Usage:
 * <LoadingButton 
 *   loading={isSubmitting}
 *   onClick={handleSubmit}
 * >
 *   Submit
 * </LoadingButton>
 */
const LoadingButton = memo(function LoadingButton({
  children,
  loading = false,
  disabled = false,
  loadingText,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const isDisabled = disabled || loading;

  const buttonClass = [
    'loading-button',
    `loading-button-${variant}`,
    `loading-button-${size}`,
    fullWidth && 'loading-button-full',
    loading && 'loading-button-loading',
    isDisabled && 'loading-button-disabled',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (isDisabled || !onClick) return;
    onClick(e);
  };

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={isDisabled}
      onClick={handleClick}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className="loading-button-spinner" aria-hidden="true">
          <span className="spinner-ring"></span>
        </span>
      )}
      <span className={loading ? 'loading-button-text-hidden' : 'loading-button-text'}>
        {loading && loadingText ? loadingText : children}
      </span>
    </button>
  );
});

LoadingButton.propTypes = {
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  loadingText: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default LoadingButton;
