import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useManagerAuth } from '../contexts/ManagerAuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import logger from '../utils/logger';
import './ManagerDashboardPage.css';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
const SOURCE_FILTERS = ['all', 'staff', 'customer'];

const ManagerDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { manager, managerLogout } = useManagerAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [stats, setStats] = useState({
    todayCount: 0,
    pendingCount: 0,
    completedToday: 0,
    todayRevenue: 0,
    staffOrdersToday: 0,
    customerOrdersToday: 0
  });

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Fetch all bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(bookingsData);
      calculateStats(bookingsData);
    } catch (error) {
      logger.error('Error fetching bookings', error);
      showToast(t('manager.fetchError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t, showToast]);

  // Calculate dashboard stats
  const calculateStats = (bookingsData) => {
    const today = getTodayDate();
    const todayBookings = bookingsData.filter(b => b.date === today);

    setStats({
      todayCount: todayBookings.length,
      pendingCount: bookingsData.filter(b => b.status === 'pending').length,
      completedToday: todayBookings.filter(b => b.status === 'completed').length,
      todayRevenue: todayBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.price || 0), 0),
      staffOrdersToday: todayBookings.filter(b => b.source === 'staff').length,
      customerOrdersToday: todayBookings.filter(b => b.source !== 'staff').length
    });
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filter bookings based on active filter and source filter
  const filteredBookings = bookings.filter(b => {
    const statusMatch = activeFilter === 'all' || b.status === activeFilter;
    const sourceMatch = sourceFilter === 'all' ||
      (sourceFilter === 'staff' && b.source === 'staff') ||
      (sourceFilter === 'customer' && b.source !== 'staff');
    return statusMatch && sourceMatch;
  });

  // Update booking status
  const handleStatusUpdate = async (booking, newStatus) => {
    const actionText = t(`manager.actions.${newStatus === 'confirmed' ? 'confirm' : newStatus === 'completed' ? 'complete' : 'cancel'}`);

    const confirmed = await confirm({
      title: t('manager.confirmAction'),
      message: t('manager.confirmMessage', { action: actionText.toLowerCase() }),
      confirmText: actionText,
      cancelText: t('common.back'),
      variant: newStatus === 'cancelled' ? 'danger' : 'primary'
    });

    if (!confirmed) return;

    setUpdatingId(booking.id);
    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: manager?.email || 'manager'
      });

      // Update local state
      setBookings(prev =>
        prev.map(b => b.id === booking.id ? { ...b, status: newStatus } : b)
      );
      calculateStats(bookings.map(b => b.id === booking.id ? { ...b, status: newStatus } : b));

      showToast(t('manager.updateSuccess'), 'success');
    } catch (error) {
      logger.error('Error updating booking', error, { bookingId: booking.id });
      showToast(t('manager.updateError'), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-AE' : 'en-AE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'confirmed': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Handle logout
  const handleLogout = () => {
    managerLogout();
    navigate('/manager/login');
  };

  // Open image modal
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  // Close image modal
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="manager-dashboard">
      {/* Header */}
      <header className="manager-header">
        <div className="header-content">
          <div className="header-left">
            <h1>{t('manager.title')}</h1>
            <p>{t('manager.subtitle')}</p>
          </div>
          <div className="header-right">
            <span className="manager-name">{manager?.email}</span>
            <button className="logout-btn" onClick={handleLogout}>
              {t('manager.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📅</span>
            <div className="stat-content">
              <span className="stat-value">{stats.todayCount}</span>
              <span className="stat-label">{t('manager.stats.todayBookings')}</span>
            </div>
          </div>
          <div className="stat-card pending">
            <span className="stat-icon">⏳</span>
            <div className="stat-content">
              <span className="stat-value">{stats.pendingCount}</span>
              <span className="stat-label">{t('manager.stats.pending')}</span>
            </div>
          </div>
          <div className="stat-card completed">
            <span className="stat-icon">✅</span>
            <div className="stat-content">
              <span className="stat-value">{stats.completedToday}</span>
              <span className="stat-label">{t('manager.stats.completedToday')}</span>
            </div>
          </div>
          <div className="stat-card revenue">
            <span className="stat-icon">💰</span>
            <div className="stat-content">
              <span className="stat-value">AED {stats.todayRevenue}</span>
              <span className="stat-label">{t('manager.stats.todayRevenue')}</span>
            </div>
          </div>
          <div className="stat-card staff">
            <span className="stat-icon">🚐</span>
            <div className="stat-content">
              <span className="stat-value">{stats.staffOrdersToday}</span>
              <span className="stat-label">{t('manager.stats.staffOrders')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Actions */}
      <div className="bookings-controls">
        <div className="filters-row">
          <div className="filter-tabs">
            {STATUS_FILTERS.map(filter => (
              <button
                key={filter}
                className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {t(`manager.filters.${filter}`)}
                {filter !== 'all' && (
                  <span className="filter-count">
                    {bookings.filter(b => b.status === filter).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="source-filters">
            {SOURCE_FILTERS.map(filter => (
              <button
                key={filter}
                className={`source-tab ${sourceFilter === filter ? 'active' : ''}`}
                onClick={() => setSourceFilter(filter)}
              >
                {filter === 'all' && '📋'}
                {filter === 'staff' && '🚐'}
                {filter === 'customer' && '👤'}
                {t(`manager.sourceFilters.${filter}`)}
              </button>
            ))}
          </div>
        </div>
        <button className="refresh-btn" onClick={fetchBookings} disabled={loading}>
          {loading ? '...' : '🔄'} {t('manager.actions.refresh')}
        </button>
      </div>

      {/* Bookings List */}
      <div className="bookings-section">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>{t('manager.noBookings')}</h3>
          </div>
        ) : (
          <div className="bookings-table">
            <div className="table-header">
              <span className="col-customer">{t('manager.table.customer')}</span>
              <span className="col-vehicle">{t('manager.table.vehicle')}</span>
              <span className="col-datetime">{t('manager.table.dateTime')}</span>
              <span className="col-location">{t('manager.table.location')}</span>
              <span className="col-price">{t('manager.table.price')}</span>
              <span className="col-status">{t('manager.table.status')}</span>
              <span className="col-actions">{t('manager.table.actions')}</span>
            </div>

            <div className="table-body">
              {filteredBookings.map(booking => (
                <div key={booking.id} className={`table-row ${booking.source === 'staff' ? 'staff-order' : ''}`}>
                  <span className="col-customer">
                    <span className="customer-id">#{booking.id.slice(-6).toUpperCase()}</span>
                    {booking.source === 'staff' && (
                      <span className="staff-badge" title={booking.enteredBy}>🚐</span>
                    )}
                    {booking.customerData && (
                      <div className="customer-details">
                        {booking.customerData.name && (
                          <span className="customer-name">{booking.customerData.name}</span>
                        )}
                        <a href={`tel:${booking.customerData.phone}`} className="customer-phone">
                          {booking.customerData.phone}
                        </a>
                      </div>
                    )}
                  </span>
                  <span className="col-vehicle">
                    <span className="vehicle-info">
                      {t(`wizard.${booking.vehicleType}`)}
                      <span className="package-name">{t(`packages.${booking.package}.name`)}</span>
                    </span>
                    {booking.vehicleImageUrl && (
                      <button
                        className="view-image-btn"
                        onClick={() => openImageModal(booking.vehicleImageUrl)}
                        title={t('manager.viewImage')}
                      >
                        📷
                      </button>
                    )}
                  </span>
                  <span className="col-datetime">
                    <span className="date">{formatDate(booking.date)}</span>
                    <span className="time">{booking.time}</span>
                  </span>
                  <span className="col-location">
                    <span className="location-area">{booking.location?.area || '-'}</span>
                    {booking.location?.villa && (
                      <span className="location-villa">{booking.location.villa}</span>
                    )}
                    {booking.vehiclesInArea > 1 && (
                      <span className="vehicles-count" title={t('manager.vehiclesInArea')}>
                        🚗 x{booking.vehiclesInArea}
                      </span>
                    )}
                  </span>
                  <span className="col-price">
                    AED {booking.price}
                  </span>
                  <span className="col-status">
                    <span className={`status-badge ${getStatusColor(booking.status)}`}>
                      {t(`track.status.${booking.status}`)}
                    </span>
                  </span>
                  <span className="col-actions">
                    {updatingId === booking.id ? (
                      <span className="updating-spinner"></span>
                    ) : (
                      <div className="action-buttons">
                        {booking.status === 'pending' && (
                          <button
                            className="action-btn confirm"
                            onClick={() => handleStatusUpdate(booking, 'confirmed')}
                            title={t('manager.actions.confirm')}
                          >
                            ✓
                          </button>
                        )}
                        {['pending', 'confirmed'].includes(booking.status) && (
                          <>
                            <button
                              className="action-btn complete"
                              onClick={() => handleStatusUpdate(booking, 'completed')}
                              title={t('manager.actions.complete')}
                            >
                              ✔
                            </button>
                            <button
                              className="action-btn cancel"
                              onClick={() => handleStatusUpdate(booking, 'cancelled')}
                              title={t('manager.actions.cancel')}
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeImageModal}>✕</button>
            <img src={selectedImage} alt={t('manager.vehiclePhoto')} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboardPage;
