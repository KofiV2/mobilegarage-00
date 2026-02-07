import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './Skeleton.css';

/**
 * Skeleton Loading Component
 * 
 * Displays a pulsing placeholder while content is loading.
 * Improves perceived performance and prevents layout shift.
 * 
 * Usage:
 * <Skeleton width={200} height={20} />
 * <Skeleton variant="circle" width={48} height={48} />
 * <Skeleton variant="rect" width="100%" height={120} />
 */
const Skeleton = memo(function Skeleton({
  variant = 'rect',
  width,
  height,
  borderRadius,
  className = '',
  animation = 'pulse',
  count = 1
}) {
  const getStyle = () => {
    const style = {};
    
    if (width) {
      style.width = typeof width === 'number' ? `${width}px` : width;
    }
    
    if (height) {
      style.height = typeof height === 'number' ? `${height}px` : height;
    }
    
    if (borderRadius) {
      style.borderRadius = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
    } else if (variant === 'circle') {
      style.borderRadius = '50%';
    } else if (variant === 'text') {
      style.borderRadius = '4px';
    }
    
    return style;
  };

  const skeletonClass = `skeleton skeleton-${variant} skeleton-${animation} ${className}`.trim();

  if (count > 1) {
    return (
      <div className="skeleton-group">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={skeletonClass} style={getStyle()} />
        ))}
      </div>
    );
  }

  return <div className={skeletonClass} style={getStyle()} />;
});

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'rect', 'circle']),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  animation: PropTypes.oneOf(['pulse', 'wave', 'none']),
  count: PropTypes.number
};

/**
 * Card Skeleton - Pre-built skeleton for card layouts
 */
export const CardSkeleton = memo(function CardSkeleton({ 
  showImage = true,
  showTitle = true,
  showDescription = true,
  showActions = false
}) {
  return (
    <div className="skeleton-card">
      {showImage && <Skeleton variant="rect" width="100%" height={160} />}
      <div className="skeleton-card-content">
        {showTitle && <Skeleton variant="text" width="60%" height={24} />}
        {showDescription && (
          <>
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="80%" height={16} />
          </>
        )}
        {showActions && (
          <div className="skeleton-card-actions">
            <Skeleton variant="rect" width={80} height={36} borderRadius={8} />
            <Skeleton variant="rect" width={80} height={36} borderRadius={8} />
          </div>
        )}
      </div>
    </div>
  );
});

CardSkeleton.propTypes = {
  showImage: PropTypes.bool,
  showTitle: PropTypes.bool,
  showDescription: PropTypes.bool,
  showActions: PropTypes.bool
};

/**
 * List Skeleton - Pre-built skeleton for list items
 */
export const SkeletonList = memo(function SkeletonList({ 
  count = 3,
  showAvatar = true,
  showSubtitle = true
}) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          {showAvatar && <Skeleton variant="circle" width={48} height={48} />}
          <div className="skeleton-list-content">
            <Skeleton variant="text" width="40%" height={18} />
            {showSubtitle && <Skeleton variant="text" width="70%" height={14} />}
          </div>
        </div>
      ))}
    </div>
  );
});

SkeletonList.propTypes = {
  count: PropTypes.number,
  showAvatar: PropTypes.bool,
  showSubtitle: PropTypes.bool
};

/**
 * Table Skeleton - Pre-built skeleton for table rows
 */
export const TableSkeleton = memo(function TableSkeleton({ 
  rows = 5,
  columns = 4
}) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              variant="text" 
              width={`${100 / columns - 5}%`} 
              height={20} 
            />
          ))}
        </div>
      ))}
    </div>
  );
});

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number
};

/**
 * Booking Card Skeleton - Specific to 3ON app
 */
export const BookingCardSkeleton = memo(function BookingCardSkeleton() {
  return (
    <div className="skeleton-booking-card">
      <div className="skeleton-booking-header">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="skeleton-booking-info">
          <Skeleton variant="text" width={120} height={20} />
          <Skeleton variant="text" width={80} height={14} />
        </div>
        <Skeleton variant="rect" width={70} height={28} borderRadius={14} />
      </div>
      <div className="skeleton-booking-details">
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>
      <div className="skeleton-booking-footer">
        <Skeleton variant="text" width={60} height={20} />
        <div className="skeleton-booking-actions">
          <Skeleton variant="rect" width={80} height={32} borderRadius={6} />
          <Skeleton variant="rect" width={80} height={32} borderRadius={6} />
        </div>
      </div>
    </div>
  );
});

/**
 * Profile Skeleton - For user profile sections
 */
export const SkeletonProfile = memo(function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <div className="skeleton-profile-header">
        <Skeleton variant="circle" width={80} height={80} />
        <div className="skeleton-profile-info">
          <Skeleton variant="text" width={150} height={24} />
          <Skeleton variant="text" width={200} height={16} />
        </div>
      </div>
      <div className="skeleton-profile-stats">
        <Skeleton variant="rect" width="30%" height={60} borderRadius={8} />
        <Skeleton variant="rect" width="30%" height={60} borderRadius={8} />
        <Skeleton variant="rect" width="30%" height={60} borderRadius={8} />
      </div>
    </div>
  );
});

// Also export as ListSkeleton for backward compatibility
export const ListSkeleton = SkeletonList;

export default Skeleton;
