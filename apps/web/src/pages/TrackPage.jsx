import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import './TrackPage.css';

const TrackPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const bookingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBookings(bookingsData);
      } catch (error) {
        logger.error('Error fetching bookings', error, { uid: user.uid });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const activeBookings = bookings.filter(b =>
    ['pending', 'confirmed'].includes(b.status)
  );

  const historyBookings = bookings.filter(b =>
    ['completed', 'cancelled'].includes(b.status)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'confirmed': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-AE' : 'en-AE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRebook = (booking) => {
    // Navigate to services with pre-filled data
    navigate('/services', { state: { rebook: booking } });
  };

  const displayBookings = activeTab === 'active' ? activeBookings : historyBookings;

  return (
    <div className="track-page">
      <header className="track-header">
        <h1>{t('track.title')}</h1>
        <p>{t('track.subtitle')}</p>
      </header>

      <div className="track-tabs">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          {t('track.active')} ({activeBookings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {t('track.history')} ({historyBookings.length})
        </button>
      </div>

      <div className="bookings-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{t('track.loading')}</p>
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>{activeTab === 'active' ? t('track.noActive') : t('track.noHistory')}</h3>
            <p>{t('track.bookFirst')}</p>
            <button
              className="book-now-btn"
              onClick={() => navigate('/services')}
            >
              {t('track.bookNow')}
            </button>
          </div>
        ) : (
          displayBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <span className={`status-badge ${getStatusColor(booking.status)}`}>
                  {t(`track.status.${booking.status}`)}
                </span>
                <span className="booking-date">{formatDate(booking.createdAt)}</span>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">{t('track.package')}:</span>
                  <span className="detail-value">{t(`packages.${booking.package}.name`)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('track.vehicle')}:</span>
                  <span className="detail-value">{t(`wizard.${booking.vehicleType}`)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('track.dateTime')}:</span>
                  <span className="detail-value">{booking.date} - {booking.time}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('track.price')}:</span>
                  <span className="detail-value price">AED {booking.price}</span>
                </div>
              </div>

              {booking.status === 'completed' && (
                <button
                  className="rebook-btn"
                  onClick={() => handleRebook(booking)}
                >
                  {t('track.rebook')}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrackPage;
