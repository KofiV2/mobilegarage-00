import React from 'react';
import PropTypes from 'prop-types';
import Skeleton, { SkeletonCard, SkeletonList, SkeletonBooking } from './Skeleton';
import './LoadingState.css';

/**
 * LoadingState Component
 * 
 * A unified loading state component that intelligently displays
 * different loading UI based on context (skeleton, spinner, inline).
 * 
 * Usage:
 * <LoadingState 
 *   loading={isLoading} 
 *   error={error}
 *   onRetry={handleRetry}
 *   skeleton="card"
 * >
 *   <YourContent />
 * </LoadingState>
 * 
 * Features:
 * - Multiple loading variants (skeleton, spinner, inline, minimal)
 * - Error state with retry option
 * - Empty state handling
 * - Smooth transitions
 * - Accessible
 */

const LoadingState = ({
  loading = false,
  error = null,
  errorMessage = null,
  empty = false,
  emptyMessage = 'No data available',
  emptyIcon = '📭',
  skeleton = null,
  skeletonCount = 3,
  variant = 'skeleton',
  message = 'Loading...',
  onRetry = null,
  retryLabel = 'Try Again',
  minHeight = null,
  children
}) => {
  // Error State
  if (error) {
    const displayMessage = errorMessage || error?.message || 'Something went wrong';
    
    return (
      <div className="loading-state loading-state-error" style={{ minHeight }}>
        <div className="loading-state-error-icon">⚠️</div>
        <div className="loading-state-error-content">
          <h3 className="loading-state-error-title">Oops!</h3>
          <p className="loading-state-error-message">{displayMessage}</p>
          {onRetry && (
            <button 
              className="loading-state-retry-btn"
              onClick={onRetry}
              type="button"
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    // Skeleton loading
    if (variant === 'skeleton' || skeleton) {
      return (
        <div className="loading-state loading-state-skeleton" style={{ minHeight }}>
          {skeleton === 'card' && (
            <div className="loading-state-skeleton-grid">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          {skeleton === 'list' && <SkeletonList count={skeletonCount} />}
          {skeleton === 'booking' && <SkeletonBooking />}
          {skeleton === 'text' && (
            <div className="loading-state-skeleton-text">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <Skeleton key={i} variant="text" width={`${Math.random() * 40 + 60}%`} />
              ))}
            </div>
          )}
          {!skeleton && (
            <div className="loading-state-skeleton-default">
              <Skeleton variant="rectangular" height="200px" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </div>
          )}
        </div>
      );
    }

    // Spinner loading
    if (variant === 'spinner') {
      return (
        <div 
          className="loading-state loading-state-spinner" 
          style={{ minHeight }}
          role="status"
          aria-label={message}
        >
          <div className="loading-spinner-large" />
          {message && <p className="loading-state-message">{message}</p>}
        </div>
      );
    }

    // Inline loading (minimal)
    if (variant === 'inline') {
      return (
        <span className="loading-state-inline" role="status" aria-label={message}>
          <span className="loading-spinner-inline" />
          {message && <span className="loading-state-inline-message">{message}</span>}
        </span>
      );
    }

    // Minimal loading (just dots)
    if (variant === 'minimal') {
      return (
        <div className="loading-state loading-state-minimal" role="status" aria-label="Loading">
          <div className="loading-dots">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
        </div>
      );
    }

    // Default to skeleton
    return (
      <div className="loading-state loading-state-skeleton" style={{ minHeight }}>
        <Skeleton variant="rectangular" height="200px" />
      </div>
    );
  }

  // Empty State
  if (empty) {
    return (
      <div className="loading-state loading-state-empty" style={{ minHeight }}>
        <div className="loading-state-empty-icon">{emptyIcon}</div>
        <p className="loading-state-empty-message">{emptyMessage}</p>
        {onRetry && (
          <button 
            className="loading-state-retry-btn loading-state-retry-btn-secondary"
            onClick={onRetry}
            type="button"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  // Content
  return children;
};

LoadingState.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  errorMessage: PropTypes.string,
  empty: PropTypes.bool,
  emptyMessage: PropTypes.string,
  emptyIcon: PropTypes.string,
  skeleton: PropTypes.oneOf(['card', 'list', 'booking', 'text', null]),
  skeletonCount: PropTypes.number,
  variant: PropTypes.oneOf(['skeleton', 'spinner', 'inline', 'minimal']),
  message: PropTypes.string,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
  minHeight: PropTypes.string,
  children: PropTypes.node
};

/**
 * InlineLoadingButton Component
 * 
 * A button with built-in loading state.
 * 
 * Usage:
 * <InlineLoadingButton loading={isSubmitting} onClick={handleSubmit}>
 *   Submit
 * </InlineLoadingButton>
 */
export const InlineLoadingButton = ({
  loading = false,
  disabled = false,
  loadingText = 'Loading...',
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`btn-loading ${className} ${loading ? 'btn-loading-active' : ''}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="loading-spinner-btn" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

InlineLoadingButton.propTypes = {
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  loadingText: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

/**
 * LoadingOverlayContent Component
 * 
 * Overlays content with a loading indicator while preserving layout.
 * 
 * Usage:
 * <LoadingOverlayContent loading={isRefreshing}>
 *   <YourContent />
 * </LoadingOverlayContent>
 */
export const LoadingOverlayContent = ({
  loading = false,
  message = 'Updating...',
  blur = true,
  children
}) => {
  return (
    <div className="loading-overlay-content-wrapper">
      <div className={`loading-overlay-content-inner ${loading ? 'is-loading' : ''} ${blur ? 'blur-on-load' : ''}`}>
        {children}
      </div>
      {loading && (
        <div className="loading-overlay-content-overlay" role="status" aria-label={message}>
          <div className="loading-spinner-overlay" />
          {message && <p className="loading-overlay-message">{message}</p>}
        </div>
      )}
    </div>
  );
};

LoadingOverlayContent.propTypes = {
  loading: PropTypes.bool,
  message: PropTypes.string,
  blur: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default LoadingState;
