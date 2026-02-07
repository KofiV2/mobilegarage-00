import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useKeyboardShortcutsContext } from '../contexts/KeyboardShortcutsContext';
import { fetchDashboardData, fetchBookingStats } from '../utils/firestoreHelpers';
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

// Statistics Icons
const ClipboardListIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    <path d="M9 12h6"></path>
    <path d="M9 16h6"></path>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const PiggyBankIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"></path>
    <path d="M2 9v1c0 1.1.9 2 2 2h1"></path>
    <path d="M16 11h.01"></path>
  </svg>
);

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  const { registerCloseHandler } = useKeyboardShortcutsContext();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [useFreeWash, setUseFreeWash] = useState(false);
  const [loyalty, setLoyalty] = useState({ washCount: 0, freeWashAvailable: false });
  const [lastBooking, setLastBooking] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    completedThisMonth: 0,
    upcomingBookings: 0,
    moneySaved: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Handle keyboard shortcut to open booking (Ctrl/Cmd+B)
  useEffect(() => {
    const handleOpenBooking = () => {
      setIsWizardOpen(true);
    };

    window.addEventListener('keyboard:openBooking', handleOpenBooking);
    return () => window.removeEventListener('keyboard:openBooking', handleOpenBooking);
  }, []);

  // Open booking if navigated with state.openBooking
  useEffect(() => {
    if (location.state?.openBooking) {
      setIsWizardOpen(true);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Register wizard close handler for Escape key
  useEffect(() => {
    if (!isWizardOpen) return;

    const unregister = registerCloseHandler(() => {
      setIsWizardOpen(false);
      setUseFreeWash(false);
    }, 10); // Priority 10 for wizard

    return unregister;
  }, [isWizardOpen, registerCloseHandler]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch dashboard data and booking stats in parallel
        const [dashboardData, stats] = await Promise.all([
          fetchDashboardData(user.uid, true),
          fetchBookingStats(user.uid, true)
        ]);

        setLoyalty(dashboardData.loyalty);
        setActiveBooking(dashboardData.activeBooking);
        setLastBooking(dashboardData.lastBooking);
        setBookingStats(stats);

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

        {/* Skeleton Statistics */}
        <section className="stats-section">
          <div className="stats-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card-skeleton">
                <Skeleton variant="rect" width="100%" height={72} borderRadius={12} />
              </div>
            ))}
          </div>
        </section>

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

      {/* Statistics Cards */}
      <section className="stats-section stagger-children">
        <div className="stats-grid">
          <div className="stat-card animate-fade-in" style={{ '--stat-color': '#3b82f6' }}>
            <div className="stat-icon">
              <ClipboardListIcon />
            </div>
            <div className="stat-content">
              <span className="stat-value">{bookingStats.totalBookings}</span>
              <span className="stat-label">{t('dashboard.stats.totalBookings')}</span>
            </div>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ '--stat-color': '#10b981' }}>
            <div className="stat-icon">
              <CheckCircleIcon />
            </div>
            <div className="stat-content">
              <span className="stat-value">{bookingStats.completedThisMonth}</span>
              <span className="stat-label">{t('dashboard.stats.completedMonth')}</span>
            </div>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ '--stat-color': '#f59e0b' }}>
            <div className="stat-icon">
              <ClockIcon />
            </div>
            <div className="stat-content">
              <span className="stat-value">{bookingStats.upcomingBookings}</span>
              <span className="stat-label">{t('dashboard.stats.upcoming')}</span>
            </div>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ '--stat-color': '#8b5cf6' }}>
            <div className="stat-icon">
              <PiggyBankIcon />
            </div>
            <div className="stat-content">
              <span className="stat-value">{bookingStats.moneySaved > 0 ? `${bookingStats.moneySaved}` : '0'}</span>
              <span className="stat-label">{t('dashboard.stats.moneySaved')}</span>
            </div>
          </div>
        </div>
      </section>

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
