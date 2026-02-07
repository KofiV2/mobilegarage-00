import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchDashboardData } from '../utils/firestoreHelpers';
import { getCurrentTier } from '../utils/loyaltyTiers';
import { getUserFriendlyError } from '../utils/errorRecovery';
import logger from '../utils/logger';
import LoyaltyProgress from '../components/LoyaltyProgress';
import BookingWizard from '../components/BookingWizard';
import LoadingOverlay from '../components/LoadingOverlay';
import Skeleton from '../components/Skeleton';
import { useToast } from '../components/Toast';
import './DashboardPage.css';

// SVG Icons
const CalendarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const RefreshIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const MapPinIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const GiftIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"></polyline>
    <rect x="2" y="7" width="20" height="5"></rect>
    <line x1="12" y1="22" x2="12" y2="7"></line>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
  </svg>
);

const SubscriptionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4"></path>
    <path d="M12 18v4"></path>
    <path d="M4.93 4.93l2.83 2.83"></path>
    <path d="M16.24 16.24l2.83 2.83"></path>
    <path d="M2 12h4"></path>
    <path d="M18 12h4"></path>
    <path d="M4.93 19.07l2.83-2.83"></path>
    <path d="M16.24 7.76l2.83-2.83"></path>
  </svg>
);

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [useFreeWash, setUseFreeWash] = useState(false);
  const [loyalty, setLoyalty] = useState({ washCount: 0, freeWashAvailable: false });
  const [lastBooking, setLastBooking] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Optimized: Single query fetches all dashboard data
        const dashboardData = await fetchDashboardData(user.uid, true);

        setLoyalty(dashboardData.loyalty);
        setActiveBooking(dashboardData.activeBooking);
        setLastBooking(dashboardData.lastBooking);

        logger.info('Dashboard data loaded successfully', { uid: user.uid });
      } catch (error) {
        logger.error('Error fetching dashboard data', error, { uid: user.uid });
        showToast(getUserFriendlyError(error), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const quickActions = [
    {
      id: 'book',
      icon: <CalendarIcon />,
      label: t('dashboard.bookNow'),
      desc: t('dashboard.bookNowDesc'),
      color: '#1a365d',
      onClick: () => setIsWizardOpen(true)
    },
    {
      id: 'rebook',
      icon: <RefreshIcon />,
      label: t('dashboard.rebook'),
      desc: t('dashboard.rebookDesc'),
      color: '#2c5282',
      onClick: () => lastBooking ? navigate('/services', { state: { rebook: lastBooking } }) : setIsWizardOpen(true),
      disabled: !lastBooking
    },
    {
      id: 'track',
      icon: <MapPinIcon />,
      label: t('dashboard.trackBooking'),
      desc: t('dashboard.trackBookingDesc'),
      color: '#2b6cb0',
      onClick: () => navigate('/track'),
      badge: activeBooking ? t('dashboard.active') : null
    },
    {
      id: 'loyalty',
      icon: <GiftIcon />,
      label: t('dashboard.loyalty'),
      desc: t('dashboard.loyaltyDesc'),
      color: '#3182ce',
      onClick: () => navigate('/profile'),
      badge: loyalty.freeWashAvailable ? t('dashboard.free') : null
    }
  ];

  if (isLoading) {
    return (
      <div className="dashboard-page">
        {/* Skeleton Header */}
        <header className="dashboard-header">
          <div className="greeting">
            <Skeleton variant="text" width="200px" height="32px" />
            <Skeleton variant="text" width="150px" height="20px" />
          </div>
          <Skeleton variant="circle" width={60} height={60} />
        </header>

        {/* Skeleton Quick Actions */}
        <section className="quick-actions">
          <div className="actions-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="action-card-skeleton">
                <Skeleton variant="rect" width="100%" height={100} borderRadius={12} />
              </div>
            ))}
          </div>
        </section>

        {/* Skeleton Loyalty */}
        <section className="loyalty-section">
          <div className="loyalty-card-dashboard" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Skeleton variant="text" width={150} height={24} />
              <Skeleton variant="text" width={40} height={24} />
            </div>
            <Skeleton variant="rect" width="100%" height={12} borderRadius={6} />
            <Skeleton variant="text" width="60%" height={16} className="skeleton-mt" />
          </div>
        </section>

        {/* Skeleton Promo */}
        <section className="promo-section">
          <Skeleton variant="rect" width="100%" height={80} borderRadius={16} />
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="greeting">
          <h1 className="animate-fade-in">{getGreeting()}, {userData?.name || t('dashboard.guest')}!</h1>
          <p className="animate-fade-in">{t('dashboard.welcomeBack')}</p>
        </div>
        <div className="header-logo">
          <img
            src="/logo.png"
            alt="3ON"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </header>

      {/* Quick Actions */}
      <section className="quick-actions stagger-children">
        <div className="actions-grid">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`action-card animate-fade-in hover-lift btn-press ${action.disabled ? 'disabled' : ''}`}
              style={{ '--action-color': action.color }}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
              {action.badge && (
                <span className="action-badge">{action.badge}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Loyalty Progress */}
      <section className="loyalty-section animate-slide-in-up">
        <div className="loyalty-card-dashboard hover-lift" onClick={() => navigate('/loyalty')}>
          <div className="loyalty-header">
            <div className="loyalty-header-left">
              <h3>{t('dashboard.loyaltyTitle')}</h3>
              {(() => {
                const tier = getCurrentTier(loyalty.washCount);
                return (
                  <span 
                    className="tier-badge-small"
                    style={{ '--tier-color': tier.color }}
                  >
                    {tier.icon} {t(`loyaltyHistory.tiers.${tier.id}`)}
                    {tier.discount > 0 && <span className="tier-discount">-{tier.discount}%</span>}
                  </span>
                );
              })()}
            </div>
            <span className="loyalty-count">{loyalty.washCount % 6}/6</span>
          </div>
          <LoyaltyProgress count={loyalty.washCount} />
          <p className="loyalty-text">
            {loyalty.freeWashAvailable
              ? t('dashboard.freeWashReady')
              : loyalty.washCount % 6 === 0 && loyalty.washCount > 0
              ? t('dashboard.congrats')
              : t('dashboard.washesToGo', { count: 6 - (loyalty.washCount % 6) })}
          </p>
          {loyalty.freeWashAvailable && (
            <button
              className="use-free-wash-btn btn-press hover-lift"
              onClick={(e) => {
                e.stopPropagation();
                setUseFreeWash(true);
                setIsWizardOpen(true);
              }}
            >
              🎁 {t('dashboard.useFreeWash')}
            </button>
          )}
          <span className="view-loyalty-link">{t('dashboard.viewLoyaltyDetails')} →</span>
        </div>
      </section>

      {/* Active Booking */}
      {activeBooking && (
        <section className="active-booking-section animate-slide-in-up">
          <h3>{t('dashboard.upcomingBooking')}</h3>
          <div className="active-booking-card hover-lift btn-press" onClick={() => navigate('/track')}>
            <div className="booking-status">
              <span className={`status-dot ${activeBooking.status}`} aria-hidden="true">
                {activeBooking.status === 'pending' && '⏳'}
                {activeBooking.status === 'confirmed' && '✓'}
                {activeBooking.status === 'on_the_way' && '🚗'}
                {activeBooking.status === 'in_progress' && '🧽'}
              </span>
              <span className="status-text">{t(`track.status.${activeBooking.status}`)}</span>
            </div>
            <div className="booking-info">
              <p className="booking-package">{t(`packages.${activeBooking.package}.name`)}</p>
              <p className="booking-datetime">{activeBooking.date} • {activeBooking.time}</p>
            </div>
            <span className="view-arrow">›</span>
          </div>
        </section>
      )}

      {/* Promo Banner */}
      <section className="promo-section animate-slide-in-up">
        <div className="promo-banner hover-scale btn-press" onClick={() => setIsWizardOpen(true)}>
          <div className="promo-content">
            <span className="promo-icon"><SubscriptionIcon /></span>
            <div className="promo-text">
              <h4>{t('dashboard.subscriptionPromo')}</h4>
              <p>{t('dashboard.subscriptionPromoDesc')}</p>
            </div>
          </div>
          <span className="promo-badge">-7.5%</span>
        </div>
      </section>

      <BookingWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setUseFreeWash(false);
        }}
        useFreeWash={useFreeWash}
      />
    </div>
  );
};

export default DashboardPage;
