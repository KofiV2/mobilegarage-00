import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoyaltyProgress from '../components/LoyaltyProgress';
import BookingWizard from '../components/BookingWizard';
import './DashboardPage.css';

const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [loyalty, setLoyalty] = useState({ washCount: 0, freeWashAvailable: false });
  const [lastBooking, setLastBooking] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch loyalty data
      try {
        const loyaltyDoc = await getDoc(doc(db, 'loyalty', user.uid));
        if (loyaltyDoc.exists()) {
          setLoyalty(loyaltyDoc.data());
        }
      } catch (error) {
        console.error('Error fetching loyalty:', error);
      }

      // Fetch last completed booking
      try {
        const bookingsRef = collection(db, 'bookings');
        const completedQuery = query(
          bookingsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const completedSnapshot = await getDocs(completedQuery);
        if (!completedSnapshot.empty) {
          setLastBooking({
            id: completedSnapshot.docs[0].id,
            ...completedSnapshot.docs[0].data()
          });
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }

      // Fetch active booking
      try {
        const bookingsRef = collection(db, 'bookings');
        const activeQuery = query(
          bookingsRef,
          where('userId', '==', user.uid),
          where('status', 'in', ['pending', 'confirmed']),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const activeSnapshot = await getDocs(activeQuery);
        if (!activeSnapshot.empty) {
          setActiveBooking({
            id: activeSnapshot.docs[0].id,
            ...activeSnapshot.docs[0].data()
          });
        }
      } catch (error) {
        console.error('Error fetching active booking:', error);
      }
    };

    fetchData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const quickActions = [
    {
      id: 'book',
      icon: '🚗',
      label: t('dashboard.bookNow'),
      color: '#1a365d',
      onClick: () => setIsWizardOpen(true)
    },
    {
      id: 'rebook',
      icon: '🔄',
      label: t('dashboard.rebook'),
      color: '#2c5282',
      onClick: () => lastBooking ? navigate('/services', { state: { rebook: lastBooking } }) : setIsWizardOpen(true),
      disabled: !lastBooking
    },
    {
      id: 'track',
      icon: '📍',
      label: t('dashboard.trackBooking'),
      color: '#2b6cb0',
      onClick: () => navigate('/track'),
      badge: activeBooking ? t('dashboard.active') : null
    },
    {
      id: 'loyalty',
      icon: '🎁',
      label: t('dashboard.loyalty'),
      color: '#3182ce',
      onClick: () => navigate('/profile'),
      badge: loyalty.freeWashAvailable ? t('dashboard.free') : null
    }
  ];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="greeting">
          <h1>{getGreeting()}, {userData?.name || t('dashboard.guest')}!</h1>
          <p>{t('dashboard.welcomeBack')}</p>
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
      <section className="quick-actions">
        <div className="actions-grid">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`action-card ${action.disabled ? 'disabled' : ''}`}
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
      <section className="loyalty-section">
        <div className="loyalty-card-dashboard">
          <div className="loyalty-header">
            <h3>{t('dashboard.loyaltyTitle')}</h3>
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
        </div>
      </section>

      {/* Active Booking */}
      {activeBooking && (
        <section className="active-booking-section">
          <h3>{t('dashboard.upcomingBooking')}</h3>
          <div className="active-booking-card" onClick={() => navigate('/track')}>
            <div className="booking-status">
              <span className={`status-dot ${activeBooking.status}`}></span>
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
      <section className="promo-section">
        <div className="promo-banner" onClick={() => setIsWizardOpen(true)}>
          <div className="promo-content">
            <span className="promo-icon">🔄</span>
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
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
