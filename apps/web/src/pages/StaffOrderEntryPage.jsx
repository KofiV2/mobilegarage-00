import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import StaffOrderForm from '../components/StaffOrderForm';
import { useToast } from '../components/Toast';
import { sanitizePhoneUri } from '../utils/sanitize';
import logger from '../utils/logger';
import { SkeletonList } from '../components/Skeleton';
import './StaffOrderEntryPage.css';

// Status progression for staff updates
const STATUS_FLOW = {
  pending: { next: 'confirmed', label: 'confirmOrder', icon: '✓' },
  confirmed: { next: 'on_the_way', label: 'startJourney', icon: '🚗' },
  on_the_way: { next: 'in_progress', label: 'startService', icon: '▶' },
  in_progress: { next: 'completed', label: 'completeService', icon: '✔' }
};

const StaffOrderEntryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { staff, staffLogout } = useStaffAuth();
  const { showToast } = useToast();

  const [recentOrders, setRecentOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [activeView, setActiveView] = useState('form'); // 'form' or 'active'
  const [todayStats, setTodayStats] = useState({
    count: 0,
    revenue: 0,
    cashTotal: 0,
    completedCount: 0,
    completionRate: 0,
    avgOrderValue: 0
  });

  // Get today's date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Fetch recent orders by this staff member
  const fetchRecentOrders = useCallback(async () => {
    if (!staff?.email || !db) {
      setLoadingOrders(false);
      return;
    }

    try {
      const bookingsRef = collection(db, 'bookings');
      const today = getTodayDate();

      // Query for recent orders (last 5 for sidebar display)
      const recentQuery = query(
        bookingsRef,
        where('enteredBy', '==', staff.email),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      // Query for today's orders (for accurate stats)
      const todayQuery = query(
        bookingsRef,
        where('enteredBy', '==', staff.email),
        where('date', '==', today)
      );

      const [recentSnapshot, todaySnapshot] = await Promise.all([
        getDocs(recentQuery),
        getDocs(todayQuery)
      ]);

      const orders = recentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRecentOrders(orders);

      // Calculate today's stats from all today's orders
      const todayOrders = todaySnapshot.docs.map(doc => doc.data());
      const cashOrders = todayOrders.filter(o => o.paymentMethod === 'cash');
      const completedOrders = todayOrders.filter(o => o.status === 'completed');
      const totalRevenue = todayOrders.reduce((sum, o) => sum + (o.price || 0), 0);

      setTodayStats({
        count: todayOrders.length,
        revenue: totalRevenue,
        cashTotal: cashOrders.reduce((sum, o) => sum + (o.price || 0), 0),
        completedCount: completedOrders.length,
        completionRate: todayOrders.length > 0 ? Math.round((completedOrders.length / todayOrders.length) * 100) : 0,
        avgOrderValue: todayOrders.length > 0 ? Math.round(totalRevenue / todayOrders.length) : 0
      });
    } catch (error) {
      logger.error('Error fetching recent orders', error);
    } finally {
      setLoadingOrders(false);
    }
  }, [staff?.email]);

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  // Real-time listener for active orders (orders needing attention)
  useEffect(() => {
    if (!staff?.email || !db) return;

    const bookingsRef = collection(db, 'bookings');
    const today = getTodayDate();

    // Listen to today's active orders created by this staff
    const activeQuery = query(
      bookingsRef,
      where('enteredBy', '==', staff.email),
      where('date', '==', today),
      where('status', 'in', ['pending', 'confirmed', 'on_the_way', 'in_progress'])
    );

    const unsubscribe = onSnapshot(
      activeQuery,
      (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by time
        orders.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        setActiveOrders(orders);
      },
      (error) => {
        logger.error('Error listening to active orders', error);
      }
    );

    return () => unsubscribe();
  }, [staff?.email]);

  // Update order status
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const bookingRef = doc(db, 'bookings', orderId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: staff?.email
      };

      // Add specific timestamp fields
      if (newStatus === 'confirmed') {
        updateData.confirmedAt = serverTimestamp();
      } else if (newStatus === 'on_the_way') {
        updateData.startedJourneyAt = serverTimestamp();
      } else if (newStatus === 'in_progress') {
        updateData.startedAt = serverTimestamp();
      } else if (newStatus === 'completed') {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(bookingRef, updateData);
      showToast(t('staff.statusUpdated'), 'success');
      fetchRecentOrders(); // Refresh stats
    } catch (error) {
      logger.error('Error updating order status', error, { orderId, newStatus });
      showToast(t('staff.statusUpdateError'), 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle order submission
  const handleOrderSubmitted = (orderId) => {
    // Refresh recent orders
    fetchRecentOrders();
  };

  // Handle logout
  const handleLogout = () => {
    staffLogout();
    navigate('/staff/login');
  };

  // Format time for display
  const formatTime = (time) => {
    if (!time || typeof time !== 'string') return '';
    const parts = time.split(':');
    if (parts.length < 2) return time; // Return original if invalid format
    const [hours, minutes] = parts;
    const hour = parseInt(hours, 10);
    if (isNaN(hour)) return time; // Return original if hours is not a number
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  return (
    <div className="staff-order-page">
      {/* Header */}
      <header className="staff-header">
        <div className="header-content">
          <div className="header-left">
            <div className="staff-logo">
              <span className="logo-icon">🚐</span>
              <span className="logo-text">3ON</span>
            </div>
            <div className="header-info">
              <h1>{t('staff.orderEntry.title')}</h1>
              <p className="staff-name">{staff?.name || staff?.email}</p>
            </div>
          </div>
          <div className="header-right">
            <div className="today-stats">
              <div className="stat">
                <span className="stat-value">{todayStats.count}</span>
                <span className="stat-label">{t('staff.orderEntry.todayOrders')}</span>
              </div>
              <div className="stat">
                <span className="stat-value">AED {todayStats.revenue}</span>
                <span className="stat-label">{t('staff.orderEntry.todayRevenue')}</span>
              </div>
              <div className="stat cash-stat">
                <span className="stat-value">💵 AED {todayStats.cashTotal}</span>
                <span className="stat-label">{t('staff.orderEntry.todayCash')}</span>
              </div>
              <div className="stat completion-stat">
                <span className="stat-value">✅ {todayStats.completionRate}%</span>
                <span className="stat-label">{t('staff.orderEntry.completionRate')}</span>
              </div>
              <div className="stat avg-stat">
                <span className="stat-value">AED {todayStats.avgOrderValue}</span>
                <span className="stat-label">{t('staff.orderEntry.avgOrderValue')}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              {t('staff.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* View Tabs - Mobile */}
      <div className="view-tabs mobile-only">
        <button
          className={`view-tab ${activeView === 'form' ? 'active' : ''}`}
          onClick={() => setActiveView('form')}
        >
          ➕ {t('staff.newOrder')}
        </button>
        <button
          className={`view-tab ${activeView === 'active' ? 'active' : ''}`}
          onClick={() => setActiveView('active')}
        >
          📋 {t('staff.activeOrders')} {activeOrders.length > 0 && <span className="badge">{activeOrders.length}</span>}
        </button>
      </div>

      <div className="page-content">
        {/* Main Form */}
        <main className={`main-section ${activeView !== 'form' ? 'mobile-hidden' : ''}`}>
          <StaffOrderForm onOrderSubmitted={handleOrderSubmitted} />
        </main>

        {/* Active Orders Section */}
        <aside className={`sidebar ${activeView !== 'active' ? 'mobile-hidden' : ''}`}>
          {/* Active Orders - Need Action */}
          <div className="active-orders-section">
            <h3 className="sidebar-title">
              <span>🔴</span>
              {t('staff.activeOrders')}
              {activeOrders.length > 0 && <span className="count-badge">{activeOrders.length}</span>}
            </h3>

            {activeOrders.length === 0 ? (
              <div className="no-orders">
                <span className="empty-icon">✅</span>
                <p>{t('staff.noActiveOrders')}</p>
              </div>
            ) : (
              <div className="orders-list active-orders">
                {activeOrders.map(order => (
                  <div key={order.id} className={`order-card active-order status-${order.status}`}>
                    <div className="order-header">
                      <span className="order-id">#{order.id.slice(-6).toUpperCase()}</span>
                      <span className={`order-status ${order.status || 'pending'}`}>
                        {t(`track.status.${order.status || 'pending'}`)}
                      </span>
                    </div>
                    <div className="order-details">
                      <div className="order-customer">
                        {order.customerData?.name && (
                          <span className="customer-name">{order.customerData.name}</span>
                        )}
                        {sanitizePhoneUri(order.customerData?.phone) ? (
                          <a href={`tel:${sanitizePhoneUri(order.customerData.phone)}`} className="customer-phone">
                            📞 {order.customerData?.phone}
                          </a>
                        ) : (
                          <span className="customer-phone">📞 {order.customerData?.phone || '-'}</span>
                        )}
                      </div>
                      <div className="order-vehicle">
                        <span className="vehicle-type">{t(`wizard.${order.vehicleType}`)}</span>
                        <span className="package-type">{t(`packages.${order.package}.name`)}</span>
                      </div>
                      <div className="order-info">
                        <span className="order-location">📍 {order.location?.area}</span>
                        <span className="order-time">🕐 {formatTime(order.time)}</span>
                      </div>
                      <div className="order-price">AED {order.price}</div>
                    </div>

                    {/* Status Update Button */}
                    {STATUS_FLOW[order.status] && (
                      <div className="status-actions">
                        <button
                          className={`status-update-btn ${order.status}`}
                          onClick={() => handleStatusUpdate(order.id, STATUS_FLOW[order.status].next)}
                          disabled={updatingOrderId === order.id}
                        >
                          {updatingOrderId === order.id ? (
                            <span className="btn-spinner"></span>
                          ) : (
                            <>
                              <span className="btn-icon">{STATUS_FLOW[order.status].icon}</span>
                              <span>{t(`staff.${STATUS_FLOW[order.status].label}`)}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="recent-orders-section">
            <h3 className="sidebar-title">
              <span>📋</span>
              {t('staff.orderEntry.recentOrders')}
            </h3>

            {loadingOrders ? (
              <div className="loading-orders">
                <SkeletonList count={3} />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="no-orders">
                <span className="empty-icon">📭</span>
                <p>{t('staff.orderEntry.noOrders')}</p>
              </div>
            ) : (
              <div className="orders-list">
                {recentOrders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <span className="order-id">#{order.id.slice(-6).toUpperCase()}</span>
                      <span className={`order-status ${order.status || 'pending'}`}>
                        {t(`track.status.${order.status || 'pending'}`)}
                      </span>
                    </div>
                    <div className="order-details">
                      <div className="order-vehicle">
                        <span className="vehicle-type">{t(`wizard.${order.vehicleType}`)}</span>
                        <span className="package-type">{t(`packages.${order.package}.name`)}</span>
                      </div>
                      <div className="order-info">
                        <span className="order-location">{order.location?.area}</span>
                        <span className="order-time">{formatTime(order.time)}</span>
                      </div>
                      <div className="order-price">AED {order.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StaffOrderEntryPage;
