import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import StaffOrderForm from '../components/StaffOrderForm';
import logger from '../utils/logger';
import './StaffOrderEntryPage.css';

const StaffOrderEntryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { staff, staffLogout } = useStaffAuth();

  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [todayStats, setTodayStats] = useState({
    count: 0,
    revenue: 0,
    cashTotal: 0
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

      setTodayStats({
        count: todayOrders.length,
        revenue: todayOrders.reduce((sum, o) => sum + (o.price || 0), 0),
        cashTotal: cashOrders.reduce((sum, o) => sum + (o.price || 0), 0)
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
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              {t('staff.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="page-content">
        {/* Main Form */}
        <main className="main-section">
          <StaffOrderForm onOrderSubmitted={handleOrderSubmitted} />
        </main>

        {/* Recent Orders Sidebar */}
        <aside className="sidebar">
          <h3 className="sidebar-title">
            <span>📋</span>
            {t('staff.orderEntry.recentOrders')}
          </h3>

          {loadingOrders ? (
            <div className="loading-orders">
              <div className="spinner"></div>
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
                    <span className={`order-status ${order.status}`}>
                      {t(`track.status.${order.status}`)}
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
        </aside>
      </div>
    </div>
  );
};

export default StaffOrderEntryPage;
