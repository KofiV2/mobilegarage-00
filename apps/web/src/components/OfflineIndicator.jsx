/**
 * OfflineIndicator Component
 * Shows offline status banner and pending bookings count
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useOfflineBooking } from '../hooks/useOfflineBooking';
import './OfflineIndicator.css';

function OfflineIndicator({ showPendingCount = true }) {
  const { t } = useTranslation();
  const { online, pendingCount, isSyncing, syncPendingBookings } = useOfflineBooking();
  const [showBanner, setShowBanner] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);
  
  // Show/hide banner based on online status
  useEffect(() => {
    if (!online) {
      setShowBanner(true);
      setJustCameOnline(false);
    } else if (showBanner && !online) {
      // Just came online
      setJustCameOnline(true);
      
      // Hide after showing "Back online" message
      const timer = setTimeout(() => {
        setShowBanner(false);
        setJustCameOnline(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [online, showBanner]);
  
  // Also show when coming back online
  useEffect(() => {
    if (online && pendingCount === 0 && !isSyncing) {
      setShowBanner(false);
    }
  }, [online, pendingCount, isSyncing]);
  
  const handleSync = () => {
    if (online && pendingCount > 0) {
      syncPendingBookings();
    }
  };
  
  // Don't show if online and no pending
  if (online && pendingCount === 0 && !isSyncing && !justCameOnline) {
    return null;
  }
  
  return (
    <>
      {/* Offline Banner */}
      {!online && (
        <div className="offline-banner offline">
          <div className="offline-banner-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="offline-banner-text">
            {t('offline.noConnection', "You're offline")}
          </span>
        </div>
      )}
      
      {/* Back Online Banner */}
      {justCameOnline && (
        <div className="offline-banner online">
          <div className="offline-banner-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="offline-banner-text">
            {t('offline.backOnline', 'Back online!')}
          </span>
        </div>
      )}
      
      {/* Pending Bookings Badge */}
      {showPendingCount && pendingCount > 0 && (
        <div className={`pending-bookings-badge ${online ? 'syncing' : ''}`}>
          <div className="pending-badge-content">
            {isSyncing ? (
              <div className="pending-spinner" />
            ) : (
              <span className="pending-count">{pendingCount}</span>
            )}
            <span className="pending-text">
              {isSyncing 
                ? t('offline.syncing', 'Syncing...')
                : t('offline.pendingBookings', 'Pending booking', { count: pendingCount })
              }
            </span>
          </div>
          
          {online && !isSyncing && (
            <button className="pending-sync-btn" onClick={handleSync}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('offline.sync', 'Sync')}
            </button>
          )}
        </div>
      )}
    </>
  );
}

OfflineIndicator.propTypes = {
  showPendingCount: PropTypes.bool,
};

export default OfflineIndicator;
