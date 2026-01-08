import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { showErrorNotification } from '../components/ErrorNotification';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    upcomingBookings: 0,
    completedBookings: 0,
    totalSpent: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const bookingsResponse = await api.get('/bookings');
      const bookings = bookingsResponse.data.bookings;

      const upcoming = bookings.filter(b =>
        ['pending', 'confirmed'].includes(b.status)
      ).length;

      const completed = bookings.filter(b =>
        b.status === 'completed'
      ).length;

      const totalSpent = bookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + b.totalPrice, 0);

      setStats({
        upcomingBookings: upcoming,
        completedBookings: completed,
        totalSpent
      });

      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showErrorNotification('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message={t('common.loading')} />;
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>{t('home.welcomeBack', { name: user?.firstName })}</h1>
        <p>{t('home.manageBookings')}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon upcoming">📅</div>
          <div className="stat-content">
            <h3>{stats.upcomingBookings}</h3>
            <p>{t('home.upcomingBookings')}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">✅</div>
          <div className="stat-content">
            <h3>{stats.completedBookings}</h3>
            <p>{t('home.completedServices')}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon spent">💰</div>
          <div className="stat-content">
            <h3>${stats.totalSpent.toFixed(2)}</h3>
            <p>{t('home.totalSpent')}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>{t('home.quickActions')}</h2>
        <div className="actions-grid">
          <Link to="/services" className="action-card">
            <span className="action-icon">🚗</span>
            <h3>{t('home.bookService')}</h3>
            <p>{t('home.scheduleNewWash')}</p>
          </Link>

          <Link to="/bookings" className="action-card">
            <span className="action-icon">📋</span>
            <h3>{t('home.myBookings')}</h3>
            <p>{t('home.viewAllBookings')}</p>
          </Link>

          <Link to="/vehicles" className="action-card">
            <span className="action-icon">🚙</span>
            <h3>{t('home.myVehicles')}</h3>
            <p>{t('home.manageVehicles')}</p>
          </Link>

          <Link to="/loyalty" className="action-card">
            <span className="action-icon">⭐</span>
            <h3>{t('nav.loyalty')}</h3>
            <p>{t('home.earnRewards')}</p>
          </Link>

          <Link to="/wallet" className="action-card">
            <span className="action-icon">💰</span>
            <h3>{t('nav.wallet')}</h3>
            <p>{t('home.manageWallet')}</p>
          </Link>

          <Link to="/profile" className="action-card">
            <span className="action-icon">👤</span>
            <h3>{t('nav.profile')}</h3>
            <p>{t('home.updateInfo')}</p>
          </Link>
        </div>
      </div>

      {recentBookings.length > 0 && (
        <div className="recent-bookings">
          <h2>{t('home.recentBookings')}</h2>
          <div className="bookings-list">
            {recentBookings.map(booking => (
              <Link
                key={booking._id}
                to={`/booking/${booking._id}`}
                className="booking-item"
              >
                <div className="booking-info">
                  <h4>{booking.serviceId?.name}</h4>
                  <p>{new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}</p>
                </div>
                <div className={`booking-status ${booking.status}`}>
                  {t(`bookings.status.${booking.status}`)}
                </div>
              </Link>
            ))}
          </div>
          <Link to="/bookings" className="view-all-link">
            {t('home.viewAllBookingsLink')} →
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
