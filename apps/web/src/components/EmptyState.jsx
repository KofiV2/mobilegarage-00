import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import './EmptyState.css';

/**
 * Beautiful empty state component with illustrations and actions
 */
const EmptyState = memo(function EmptyState({
  type = 'default',
  title,
  description,
  action,
  actionLabel,
  icon,
  compact = false
}) {
  const { t } = useTranslation();

  // Built-in illustrations for common empty states
  const illustrations = {
    bookings: (
      <svg className="empty-illustration" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="50" fill="var(--primary-soft)" />
        <rect x="35" y="30" width="50" height="60" rx="4" fill="var(--bg-card)" stroke="var(--border-primary)" strokeWidth="2" />
        <line x1="45" y1="45" x2="75" y2="45" stroke="var(--border-secondary)" strokeWidth="3" strokeLinecap="round" />
        <line x1="45" y1="55" x2="65" y2="55" stroke="var(--border-secondary)" strokeWidth="3" strokeLinecap="round" />
        <line x1="45" y1="65" x2="70" y2="65" stroke="var(--border-secondary)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="55" cy="75" r="3" fill="var(--primary-color)" />
        <circle cx="65" cy="75" r="3" fill="var(--primary-light)" />
      </svg>
    ),
    vehicles: (
      <svg className="empty-illustration" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="50" fill="var(--primary-soft)" />
        <path d="M30 70 L40 55 L50 50 L70 50 L80 55 L90 70 L90 80 L30 80 Z" fill="var(--bg-card)" stroke="var(--border-primary)" strokeWidth="2" />
        <circle cx="42" cy="80" r="8" fill="var(--text-tertiary)" />
        <circle cx="78" cy="80" r="8" fill="var(--text-tertiary)" />
        <path d="M50 55 L55 45 L65 45 L70 55" fill="var(--primary-soft)" stroke="var(--primary-color)" strokeWidth="2" />
        <line x1="55" y1="65" x2="65" y2="65" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    search: (
      <svg className="empty-illustration" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="50" fill="var(--primary-soft)" />
        <circle cx="52" cy="52" r="20" fill="var(--bg-card)" stroke="var(--border-primary)" strokeWidth="3" />
        <line x1="66" y1="66" x2="85" y2="85" stroke="var(--primary-color)" strokeWidth="4" strokeLinecap="round" />
        <line x1="45" y1="52" x2="59" y2="52" stroke="var(--border-secondary)" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="45" x2="52" y2="59" stroke="var(--border-secondary)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    error: (
      <svg className="empty-illustration" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="50" fill="var(--danger-soft)" />
        <circle cx="60" cy="60" r="30" fill="var(--bg-card)" stroke="var(--danger-color)" strokeWidth="3" />
        <line x1="50" y1="50" x2="70" y2="70" stroke="var(--danger-color)" strokeWidth="4" strokeLinecap="round" />
        <line x1="70" y1="50" x2="50" y2="70" stroke="var(--danger-color)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
    offline: (
      <svg className="empty-illustration" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="50" fill="var(--warning-soft)" />
        <path d="M35 70 Q60 50 85 70" fill="none" stroke="var(--text-tertiary)" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4" />
        <path d="M45 78 Q60 62 75 78" fill="none" stroke="var(--text-tertiary)" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 3" />
        <circle cx="60" cy="85" r="4" fill="var(--warning-color)" />
        <line x1="40" y1="45" x2="80" y2="85" stroke="var(--danger-color)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    default: (
      <svg className="empty-illustration" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="50" fill="var(--primary-soft)" />
        <rect x="40" y="45" width="40" height="35" rx="4" fill="var(--bg-card)" stroke="var(--border-primary)" strokeWidth="2" />
        <circle cx="60" cy="62" r="10" fill="var(--primary-soft)" stroke="var(--primary-color)" strokeWidth="2" />
        <path d="M55 62 L58 65 L65 58" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  };

  const defaultMessages = {
    bookings: {
      title: t('track.noBookings', 'No Bookings Yet'),
      description: t('track.noBookingsDesc', "You haven't made any bookings. Start by scheduling a car wash!")
    },
    vehicles: {
      title: t('savedVehicles.empty', 'No Saved Vehicles'),
      description: t('savedVehicles.emptyDesc', 'Add your vehicles for faster booking')
    },
    search: {
      title: t('search.noResults', 'No Results Found'),
      description: t('search.noResultsDesc', 'Try adjusting your search or filters')
    },
    error: {
      title: t('error.somethingWrong', 'Something Went Wrong'),
      description: t('error.tryAgain', 'Please try again later')
    },
    offline: {
      title: t('offline.noConnection', "You're Offline"),
      description: t('offline.checkConnection', 'Please check your internet connection')
    },
    default: {
      title: t('empty.noData', 'No Data'),
      description: t('empty.noDataDesc', 'Nothing to show here yet')
    }
  };

  const currentIllustration = icon || illustrations[type] || illustrations.default;
  const currentTitle = title || defaultMessages[type]?.title || defaultMessages.default.title;
  const currentDescription = description || defaultMessages[type]?.description || defaultMessages.default.description;

  return (
    <div className={`empty-state ${compact ? 'empty-state--compact' : ''}`}>
      <div className="empty-state__illustration">
        {currentIllustration}
      </div>
      <h3 className="empty-state__title">{currentTitle}</h3>
      <p className="empty-state__description">{currentDescription}</p>
      {action && (
        <button className="empty-state__action" onClick={action}>
          {actionLabel || t('common.getStarted', 'Get Started')}
        </button>
      )}
    </div>
  );
});

export default EmptyState;
