import React from 'react';
import PropTypes from 'prop-types';
import './Skeleton.css';

/**
 * Skeleton Loader Component
 *
 * Displays skeleton loading placeholders for better perceived performance.
 *
 * Usage:
 * <Skeleton variant="text" width="100%" height="20px" />
 * <Skeleton variant="circular" width="40px" height="40px" />
 * <Skeleton variant="rectangular" width="100%" height="200px" />
 *
 * Pre-built Skeletons:
 * <SkeletonCard />
 * <SkeletonList count={3} />
 * <SkeletonBooking />
 *
 * Features:
 * - Multiple variants (text, circular, rectangular, rounded)
 * - Customizable dimensions
 * - Smooth shimmer animation
 * - Pre-built common patterns
 * - Accessible (ARIA labels)
 * - Respects reduced motion preferences
 */

const Skeleton = ({
  variant = 'text',
  width = '100%',
  height,
  borderRadius,
  animation = 'wave',
  className = ''
}) => {
  const defaultHeights = {
    text: '16px',
    circular: '40px',
    rectangular: '100px',
    rounded: '100px'
  };

  const defaultBorderRadius = {
    text: '4px',
    circular: '50%',
    rectangular: '8px',
    rounded: '12px'
  };

  const skeletonStyle = {
    width,
    height: height || defaultHeights[variant],
    borderRadius: borderRadius || defaultBorderRadius[variant]
  };

  return (
    <div
      className={`skeleton skeleton-${variant} skeleton-${animation} ${className}`}
      style={skeletonStyle}
      role="status"
      aria-label="Loading..."
      aria-busy="true"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'circular', 'rectangular', 'rounded']),
  width: PropTypes.string,
  height: PropTypes.string,
  borderRadius: PropTypes.string,
  animation: PropTypes.oneOf(['wave', 'pulse', 'none']),
  className: PropTypes.string
};

// Pre-built Skeleton Patterns

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <Skeleton variant="rectangular" height="200px" />
    <div className="skeleton-card-content">
      <Skeleton variant="text" width="60%" height="24px" />
      <Skeleton variant="text" width="100%" height="16px" />
      <Skeleton variant="text" width="100%" height="16px" />
      <Skeleton variant="text" width="80%" height="16px" />
      <div className="skeleton-card-footer">
        <Skeleton variant="rounded" width="100px" height="36px" />
        <Skeleton variant="text" width="80px" height="20px" />
      </div>
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-list-item">
        <Skeleton variant="circular" width="48px" height="48px" />
        <div className="skeleton-list-content">
          <Skeleton variant="text" width="40%" height="18px" />
          <Skeleton variant="text" width="70%" height="14px" />
        </div>
      </div>
    ))}
  </div>
);

SkeletonList.propTypes = {
  count: PropTypes.number
};

export const SkeletonBooking = () => (
  <div className="skeleton-booking">
    <div className="skeleton-booking-header">
      <Skeleton variant="text" width="50%" height="28px" />
      <Skeleton variant="rounded" width="80px" height="32px" />
    </div>
    <div className="skeleton-booking-section">
      <Skeleton variant="text" width="30%" height="18px" />
      <Skeleton variant="rectangular" height="56px" />
    </div>
    <div className="skeleton-booking-section">
      <Skeleton variant="text" width="30%" height="18px" />
      <Skeleton variant="rectangular" height="56px" />
    </div>
    <div className="skeleton-booking-section">
      <Skeleton variant="text" width="30%" height="18px" />
      <div className="skeleton-booking-grid">
        <Skeleton variant="rounded" height="100px" />
        <Skeleton variant="rounded" height="100px" />
        <Skeleton variant="rounded" height="100px" />
      </div>
    </div>
    <Skeleton variant="rounded" height="48px" />
  </div>
);

export const SkeletonProfile = () => (
  <div className="skeleton-profile">
    <div className="skeleton-profile-header">
      <Skeleton variant="circular" width="80px" height="80px" />
      <div className="skeleton-profile-info">
        <Skeleton variant="text" width="150px" height="24px" />
        <Skeleton variant="text" width="200px" height="16px" />
      </div>
    </div>
    <div className="skeleton-profile-stats">
      <div className="skeleton-stat">
        <Skeleton variant="text" width="60px" height="32px" />
        <Skeleton variant="text" width="80px" height="14px" />
      </div>
      <div className="skeleton-stat">
        <Skeleton variant="text" width="60px" height="32px" />
        <Skeleton variant="text" width="80px" height="14px" />
      </div>
      <div className="skeleton-stat">
        <Skeleton variant="text" width="60px" height="32px" />
        <Skeleton variant="text" width="80px" height="14px" />
      </div>
    </div>
    <div className="skeleton-profile-section">
      <Skeleton variant="text" width="40%" height="20px" />
      <Skeleton variant="rectangular" height="200px" />
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="skeleton-dashboard">
    <Skeleton variant="text" width="200px" height="32px" />
    <div className="skeleton-dashboard-cards">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export default Skeleton;
