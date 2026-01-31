import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import './TrackPage.css';

const TrackPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  const handleReschedule = (booking) => {
    // Navigate to services with booking data for rescheduling
    navigate('/services', {
      state: {
        reschedule: true,
        bookingId: booking.id,
        vehicleType: booking.vehicleType,
        package: booking.package,
        price: booking.price
      }
    });
  };

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

  const handleCancel = async (booking) => {
    const confirmed = await confirm({
      title: t('track.cancelBooking'),
      message: t('track.cancelConfirmMessage'),
      confirmText: t('track.confirmCancel'),
      cancelText: t('common.back'),
      variant: 'danger'
    });

    if (!confirmed) return;

    setCancellingId(booking.id);
    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: new Date()
      });

      // Update local state
      setBookings(prev =>
        prev.map(b =>
          b.id === booking.id ? { ...b, status: 'cancelled' } : b
        )
      );

      showToast(t('track.cancelSuccess'), 'success');
    } catch (error) {
      logger.error('Error cancelling booking', error, { bookingId: booking.id });
      showToast(t('track.cancelError'), 'error');
    } finally {
      setCancellingId(null);
    }
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

              <div className="booking-actions">
                {['pending', 'confirmed'].includes(booking.status) && (
                  <>
                    <button
                      className="reschedule-btn"
                      onClick={() => handleReschedule(booking)}
                    >
                      {t('track.reschedule')}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancel(booking)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? (
                        <span className="btn-spinner"></span>
                      ) : (
                        t('track.cancel')
                      )}
                    </button>
                  </>
                )}
                {booking.status === 'completed' && (
                  <button
                    className="rebook-btn"
                    onClick={() => handleRebook(booking)}
                  >
                    {t('track.rebook')}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrackPage;
