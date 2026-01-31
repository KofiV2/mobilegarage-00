import React from 'react';
import PropTypes from 'prop-types';
import './LoadingOverlay.css';

/**
 * LoadingOverlay Component
 *
 * Displays a loading overlay with spinner and optional message.
 *
 * Usage:
 * <LoadingOverlay isLoading={true} message="Loading..." />
 *
 * Features:
 * - Full-screen or inline overlay
 * - Customizable message
 * - Smooth animations
 * - Blocks user interaction while loading
 * - Accessible (ARIA labels)
 * - Multiple spinner variants
 */

const LoadingOverlay = ({
  isLoading,
  message = 'Loading...',
  fullScreen = true,
  variant = 'spinner',
  transparent = false
}) => {
  if (!isLoading) return null;

  const overlayClass = `loading-overlay ${fullScreen ? 'fullscreen' : 'inline'} ${transparent ? 'transparent' : ''}`;

  return (
    <div className={overlayClass} role="progressbar" aria-label={message} aria-busy="true">
      <div className="loading-content">
        {variant === 'spinner' && (
          <div className="loading-spinner">
            <div className="spinner-circle"></div>
          </div>
        )}

        {variant === 'dots' && (
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        )}

        {variant === 'pulse' && (
          <div className="loading-pulse">
            <div className="pulse-circle"></div>
            <div className="pulse-circle"></div>
            <div className="pulse-circle"></div>
          </div>
        )}

        {variant === 'car' && (
          <div className="loading-car">
            <div className="car-icon">🚗</div>
            <div className="car-track"></div>
          </div>
        )}

        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

LoadingOverlay.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
  variant: PropTypes.oneOf(['spinner', 'dots', 'pulse', 'car']),
  transparent: PropTypes.bool
};

export default LoadingOverlay;
