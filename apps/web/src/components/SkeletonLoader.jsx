import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './SkeletonLoader.css';

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={40} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={50} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const StatCardSkeleton = ({ count = 4 }) => {
  return (
    <div className="skeleton-stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <div className="skeleton-stat-icon">
            <Skeleton circle width={60} height={60} />
          </div>
          <div className="skeleton-stat-details">
            <Skeleton width={100} height={16} />
            <Skeleton width={80} height={32} style={{ marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton = ({ height = 300 }) => {
  return (
    <div className="skeleton-chart">
      <Skeleton height={height} />
    </div>
  );
};

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="skeleton-cards">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <Skeleton height={200} />
          <div style={{ padding: '1rem' }}>
            <Skeleton count={2} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <Skeleton circle width={40} height={40} />
          <div className="skeleton-list-content">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="skeleton-form">
      <Skeleton height={20} width={100} style={{ marginBottom: 8 }} />
      <Skeleton height={40} style={{ marginBottom: 24 }} />

      <Skeleton height={20} width={100} style={{ marginBottom: 8 }} />
      <Skeleton height={40} style={{ marginBottom: 24 }} />

      <Skeleton height={20} width={100} style={{ marginBottom: 8 }} />
      <Skeleton height={100} style={{ marginBottom: 24 }} />

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <Skeleton width={100} height={40} />
        <Skeleton width={100} height={40} />
      </div>
    </div>
  );
};

export const PageSkeleton = () => {
  return (
    <div className="skeleton-page">
      <div className="skeleton-page-header">
        <Skeleton width={300} height={32} />
        <Skeleton width={200} height={16} style={{ marginTop: 8 }} />
      </div>

      <StatCardSkeleton count={4} />

      <div className="skeleton-page-content">
        <TableSkeleton rows={10} columns={6} />
      </div>
    </div>
  );
};

export default Skeleton;
