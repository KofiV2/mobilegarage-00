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
  const overlayClass = `loading-overlay ${fullScreen ? 'fullscreen' : 'inline'} ${transparent ? 'transparent' : ''}`;

  // Return an aria-live region even when not loading, so screen readers are notified of changes
  if (!isLoading) {
    return (
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {/* Empty when not loading - screen reader will announce when content appears */}
      </div>
    );
  }

  return (
    <>
      {/* Announce loading state to screen readers */}
      <div 
        role="status" 
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
      
      <div 
        className={overlayClass} 
        role="progressbar" 
        aria-label={message} 
        aria-busy="true"
        aria-valuetext={message}
      >
        <div className="loading-content">
          {variant === 'spinner' && (
            <div className="loading-spinner" aria-hidden="true">
              <div className="spinner-circle"></div>
            </div>
          )}

          {variant === 'dots' && (
            <div className="loading-dots" aria-hidden="true">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}

          {variant === 'pulse' && (
            <div className="loading-pulse" aria-hidden="true">
              <div className="pulse-circle"></div>
              <div className="pulse-circle"></div>
              <div className="pulse-circle"></div>
            </div>
          )}

          {variant === 'car' && (
            <div className="loading-car" aria-hidden="true">
              <div className="car-icon">🚗</div>
              <div className="car-track"></div>
            </div>
          )}

          {message && <p className="loading-message" aria-hidden="true">{message}</p>}
        </div>
      </div>
    </>
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
