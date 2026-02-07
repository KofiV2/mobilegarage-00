import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './GuestTrackPage.css';

// Status progression order for live tracking
const STATUS_ORDER = ['pending', 'confirmed', 'on_the_way', 'in_progress', 'completed'];

const GuestTrackPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  // Format phone number for display
  const formatPhoneInput = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 9);
  };

  // Validate UAE mobile number
  const isValidUAEMobile = (phone) => {
    return phone.length === 9 && phone.startsWith('5');
  };

  // Search for bookings by phone number
  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidUAEMobile(phoneNumber)) {
      setError(t('guestTrack.invalidPhone'));
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const fullNumber = `+971${phoneNumber}`;
      const bookingsRef = collection(db, 'bookings');
      
      // Query for bookings with this guest phone
      const q = query(
        bookingsRef,
        where('guestPhone', '==', fullNumber),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setBookings(bookingsData);
    } catch (error) {
      logger.error('Error fetching guest bookings', error);
      setError(t('guestTrack.searchError'));
    } finally {
      setLoading(false);
    }
  };

  const activeBookings = bookings.filter(b =>
    ['pending', 'confirmed', 'on_the_way', 'in_progress'].includes(b.status)
  );

  const historyBookings = bookings.filter(b =>
    ['completed', 'cancelled'].includes(b.status)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'confirmed': return 'blue';
      case 'on_the_way': return 'purple';
      case 'in_progress': return 'cyan';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '📝';
      case 'confirmed': return '✓';
      case 'on_the_way': return '🚗';
      case 'in_progress': return '🧽';
      case 'completed': return '✨';
      case 'cancelled': return '✕';
      default: return '•';
    }
  };

  const isStatusPast = (currentStatus, checkStatus) => {
    if (currentStatus === 'cancelled') return false;
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const checkIndex = STATUS_ORDER.indexOf(checkStatus);
    return checkIndex < currentIndex;
  };

  const isStatusActive = (currentStatus, checkStatus) => {
    return currentStatus === checkStatus;
  };

  const formatTimelineTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString(i18n.language === 'ar' ? 'ar-AE' : 'en-AE', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const displayBookings = activeTab === 'active' ? activeBookings : historyBookings;

  return (
    <div className="guest-track-page">
      <header className="guest-track-header">
        <Link to="/auth" className="back-link">← {t('common.back')}</Link>
        <h1>{t('guestTrack.title')}</h1>
        <p>{t('guestTrack.subtitle')}</p>
      </header>

      {/* Phone Search Form */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="phone-input-group">
            <div className="phone-prefix">
              <span className="uae-flag">🇦🇪</span>
              <span className="prefix-code">+971</span>
            </div>
            <input
              type="tel"
              className="phone-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
              placeholder="5X XXX XXXX"
              disabled={loading}
            />
          </div>

          {error && <p className="search-error">{error}</p>}

          <button
            type="submit"
            className="search-btn"
            disabled={loading || phoneNumber.length !== 9}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner-small"></span>
                {t('guestTrack.searching')}
              </span>
            ) : (
              t('guestTrack.searchBtn')
            )}
          </button>
        </form>

        <p className="search-hint">{t('guestTrack.hint')}</p>
      </div>

      {/* Results Section */}
      {searched && !loading && (
        <>
          {bookings.length > 0 ? (
            <>
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
                {displayBookings.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📋</span>
                    <h3>{activeTab === 'active' ? t('track.noActive') : t('track.noHistory')}</h3>
                  </div>
                ) : (
                  displayBookings.map((booking) => (
                    <div key={booking.id} className={`booking-card ${expandedBookingId === booking.id ? 'expanded' : ''}`}>
                      <div
                        className="booking-header"
                        onClick={() => setExpandedBookingId(expandedBookingId === booking.id ? null : booking.id)}
                      >
                        <div className="header-left">
                          <span className={`status-badge ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)} {t(`track.status.${booking.status}`)}
                          </span>
                          <span className="booking-id">#{booking.id?.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="header-right">
                          <span className="booking-date">{formatDate(booking.createdAt)}</span>
                          <span className={`expand-icon ${expandedBookingId === booking.id ? 'expanded' : ''}`}>▼</span>
                        </div>
                      </div>

                      {/* Live Progress Timeline - Show for active bookings */}
                      {activeTab === 'active' && booking.status !== 'cancelled' && (
                        <div className="progress-timeline">
                          <div className="timeline-label">{t('track.liveTracking')}</div>
                          <div className="timeline-stages">
                            {STATUS_ORDER.map((stage, index) => (
                              <div
                                key={stage}
                                className={`timeline-stage
                                  ${isStatusPast(booking.status, stage) ? 'done' : ''}
                                  ${isStatusActive(booking.status, stage) ? 'active' : ''}
                                `}
                              >
                                <div className="stage-dot">
                                  {isStatusPast(booking.status, stage) ? '✓' : getStatusIcon(stage)}
                                </div>
                                <div className="stage-info">
                                  <span className="stage-label">{t(`track.timeline.${stage}`)}</span>
                                  {isStatusActive(booking.status, stage) && booking.status === 'on_the_way' && booking.estimatedArrival && (
                                    <span className="stage-eta">
                                      {t('track.eta')}: {formatTimelineTime(booking.estimatedArrival)}
                                    </span>
                                  )}
                                </div>
                                {index < STATUS_ORDER.length - 1 && <div className="stage-connector" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cancelled Status Banner */}
                      {booking.status === 'cancelled' && (
                        <div className="cancelled-banner">
                          <span className="cancelled-icon">✕</span>
                          <span>{t('track.bookingCancelled')}</span>
                        </div>
                      )}

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
                        {booking.assignedStaff && (
                          <div className="detail-row">
                            <span className="detail-label">{t('track.assignedTo')}:</span>
                            <span className="detail-value">{booking.assignedStaff}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <h3>{t('guestTrack.noBookings')}</h3>
              <p>{t('guestTrack.noBookingsDesc')}</p>
              <button
                className="book-now-btn"
                onClick={() => navigate('/auth')}
              >
                {t('guestTrack.bookNow')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Sign in prompt */}
      <div className="signin-prompt">
        <p>{t('guestTrack.signInPrompt')}</p>
        <Link to="/auth" className="signin-link">{t('guestTrack.signIn')}</Link>
      </div>
    </div>
  );
};

export default GuestTrackPage;
