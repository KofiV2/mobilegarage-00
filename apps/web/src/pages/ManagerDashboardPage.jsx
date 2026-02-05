import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useManagerAuth } from '../contexts/ManagerAuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { escapeHtml, sanitizePhoneUri } from '../utils/sanitize';
import logger from '../utils/logger';
import { SkeletonList } from '../components/Skeleton';
import './ManagerDashboardPage.css';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'on_the_way', 'in_progress', 'completed', 'cancelled'];
const SOURCE_FILTERS = ['all', 'staff', 'customer'];
const DATE_RANGES = ['today', 'week', 'month', 'all'];

// Status progression flow for manager
const STATUS_FLOW = {
  pending: { next: 'confirmed', icon: '✓', action: 'confirm' },
  confirmed: { next: 'on_the_way', icon: '🚗', action: 'dispatch' },
  on_the_way: { next: 'in_progress', icon: '▶', action: 'start' },
  in_progress: { next: 'completed', icon: '✔', action: 'complete' }
};

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
  const [dateRange, setDateRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    cancellationRate: 0,
    staffOrders: 0,
    customerOrders: 0
  });

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Filter bookings by date range - pure function, no hooks needed
  const filterByDateRange = (bookingsData, range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (range) {
      case 'today':
        const todayStr = getTodayDate();
        return bookingsData.filter(b => b.date === todayStr);
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return bookingsData.filter(b => {
          const bookingDate = new Date(b.date);
          return bookingDate >= weekAgo;
        });
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return bookingsData.filter(b => {
          const bookingDate = new Date(b.date);
          return bookingDate >= monthAgo;
        });
      case 'all':
      default:
        return bookingsData;
    }
  };

  // Calculate dashboard stats based on date range - pure function
  const calculateStats = (bookingsData, range) => {
    const filtered = filterByDateRange(bookingsData, range);
    const totalOrders = filtered.length;
    const completedCount = filtered.filter(b => b.status === 'completed').length;
    const cancelledCount = filtered.filter(b => b.status === 'cancelled').length;
    const totalRevenue = filtered
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.price || 0), 0);

    setStats({
      totalOrders,
      pendingCount: filtered.filter(b => b.status === 'pending').length,
      completedCount,
      cancelledCount,
      totalRevenue,
      avgOrderValue: completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0,
      cancellationRate: totalOrders > 0 ? ((cancelledCount / totalOrders) * 100).toFixed(1) : 0,
      staffOrders: filtered.filter(b => b.source === 'staff').length,
      customerOrders: filtered.filter(b => b.source !== 'staff').length
    });
  };

  // Real-time bookings listener
  useEffect(() => {
    setLoading(true);
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('createdAt', 'desc'), limit(500));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(bookingsData);
      calculateStats(bookingsData, dateRange);
      setLoading(false);
    }, (error) => {
      logger.error('Error fetching bookings', error);
      showToast(t('manager.fetchError'), 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [t, showToast, dateRange]);

  // Recalculate stats when date range changes
  useEffect(() => {
    if (bookings.length > 0) {
      calculateStats(bookings, dateRange);
    }
  }, [dateRange, bookings]);

  // Filter bookings based on active filter, source filter, and search query (memoized)
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const statusMatch = activeFilter === 'all' || b.status === activeFilter;
      const sourceMatch = sourceFilter === 'all' ||
        (sourceFilter === 'staff' && b.source === 'staff') ||
        (sourceFilter === 'customer' && b.source !== 'staff');

      // Search filter - match phone or name
      const searchMatch = !searchQuery.trim() ||
        b.customerData?.phone?.includes(searchQuery.trim()) ||
        b.customerData?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      return statusMatch && sourceMatch && searchMatch;
    });
  }, [bookings, activeFilter, sourceFilter, searchQuery]);

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
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: manager?.email || 'manager'
      };

      // Add status-specific timestamps
      if (newStatus === 'confirmed') {
        updateData.confirmedAt = serverTimestamp();
      } else if (newStatus === 'on_the_way') {
        updateData.startedJourneyAt = serverTimestamp();
      } else if (newStatus === 'in_progress') {
        updateData.startedAt = serverTimestamp();
      } else if (newStatus === 'completed') {
        updateData.completedAt = serverTimestamp();
      } else if (newStatus === 'cancelled') {
        updateData.cancelledAt = serverTimestamp();
      }

      await updateDoc(bookingRef, updateData);
      // Note: Local state will be updated automatically via onSnapshot listener

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
      case 'on_the_way': return 'purple';
      case 'in_progress': return 'cyan';
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

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'Vehicle', 'Package', 'Location', 'Date', 'Time', 'Price', 'Status', 'Source'];
    const rows = filteredBookings.map(b => [
      b.id,
      b.customerData?.name || '',
      b.customerData?.phone || '',
      b.vehicleType || '',
      b.package || '',
      b.location?.area || '',
      b.date || '',
      b.time || '',
      b.price || 0,
      b.status || '',
      b.source || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(t('manager.exportSuccess'), 'success');
  };

  // Export to PDF (print-friendly format)
  const handleExportPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orders Report - ${t(`manager.dateRange.${dateRange}`)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; direction: ${i18n.language === 'ar' ? 'rtl' : 'ltr'}; }
          h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
          .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
          .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; min-width: 120px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
          .stat-label { color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: ${i18n.language === 'ar' ? 'right' : 'left'}; font-size: 11px; }
          th { background: #007bff; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 30px; color: #666; font-size: 11px; text-align: center; }
        </style>
      </head>
      <body>
        <h1>3ON Car Wash - ${t('manager.title')}</h1>
        <p>${t(`manager.dateRange.${dateRange}`)} | ${new Date().toLocaleString(i18n.language === 'ar' ? 'ar-AE' : 'en-AE')}</p>

        <div class="stats">
          <div class="stat-card"><div class="stat-value">${stats.totalOrders}</div><div class="stat-label">${t('manager.stats.totalOrders')}</div></div>
          <div class="stat-card"><div class="stat-value">${stats.completedCount}</div><div class="stat-label">${t('manager.stats.completed')}</div></div>
          <div class="stat-card"><div class="stat-value">AED ${stats.totalRevenue}</div><div class="stat-label">${t('manager.stats.revenue')}</div></div>
          <div class="stat-card"><div class="stat-value">${stats.cancellationRate}%</div><div class="stat-label">${t('manager.stats.cancellationRate')}</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>${t('manager.table.customer')}</th>
              <th>${t('manager.table.vehicle')}</th>
              <th>${t('manager.table.dateTime')}</th>
              <th>${t('manager.table.location')}</th>
              <th>${t('manager.table.price')}</th>
              <th>${t('manager.table.status')}</th>
            </tr>
          </thead>
          <tbody>
            ${filteredBookings.map(b => `
              <tr>
                <td>${escapeHtml(b.id?.slice(-6)?.toUpperCase())}</td>
                <td>${escapeHtml(b.customerData?.name) || '-'}<br/>${escapeHtml(b.customerData?.phone) || ''}</td>
                <td>${escapeHtml(b.vehicleType) || '-'}<br/>${escapeHtml(b.package) || ''}</td>
                <td>${escapeHtml(b.date) || '-'}<br/>${escapeHtml(b.time) || ''}</td>
                <td>${escapeHtml(b.location?.area) || '-'}<br/>${escapeHtml(b.location?.villa) || ''}</td>
                <td>AED ${escapeHtml(b.price) || 0}</td>
                <td>${escapeHtml(t(\`track.status.\${b.status || 'pending'}\`))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">3ON Mobile Car Wash | ${new Date().toLocaleDateString()}</div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Handle editing a booking
  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setEditForm({
      date: booking.date || '',
      time: booking.time || '',
      area: booking.location?.area || '',
      villa: booking.location?.villa || '',
      price: booking.price || 0,
      notes: booking.notes || ''
    });
  };

  // Save edited booking
  const handleSaveEdit = async () => {
    if (!editingBooking) return;

    setUpdatingId(editingBooking.id);
    try {
      const bookingRef = doc(db, 'bookings', editingBooking.id);
      await updateDoc(bookingRef, {
        date: editForm.date,
        time: editForm.time,
        location: {
          ...editingBooking.location,
          area: editForm.area,
          villa: editForm.villa
        },
        price: Number(editForm.price),
        notes: editForm.notes,
        updatedAt: serverTimestamp(),
        updatedBy: manager?.email || 'manager'
      });
      showToast(t('manager.updateSuccess'), 'success');
      setEditingBooking(null);
    } catch (error) {
      logger.error('Error updating booking', error);
      showToast(t('manager.updateError'), 'error');
    } finally {
      setUpdatingId(null);
    }
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

      {/* Date Range Filter */}
      <div className="date-range-section">
        <div className="date-range-buttons">
          {DATE_RANGES.map(range => (
            <button
              key={range}
              className={`date-range-btn ${dateRange === range ? 'active' : ''}`}
              onClick={() => setDateRange(range)}
            >
              {t(`manager.dateRange.${range}`)}
            </button>
          ))}
        </div>
        <div className="export-buttons">
          <button className="export-btn" onClick={handleExportCSV} disabled={filteredBookings.length === 0}>
            📥 CSV
          </button>
          <button className="export-btn pdf" onClick={handleExportPDF} disabled={filteredBookings.length === 0}>
            📄 PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <div className="stat-content">
              <span className="stat-value">{stats.totalOrders}</span>
              <span className="stat-label">{t('manager.stats.totalOrders')}</span>
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
              <span className="stat-value">{stats.completedCount}</span>
              <span className="stat-label">{t('manager.stats.completed')}</span>
            </div>
          </div>
          <div className="stat-card revenue">
            <span className="stat-icon">💰</span>
            <div className="stat-content">
              <span className="stat-value">AED {stats.totalRevenue}</span>
              <span className="stat-label">{t('manager.stats.revenue')}</span>
            </div>
          </div>
          <div className="stat-card average">
            <span className="stat-icon">📊</span>
            <div className="stat-content">
              <span className="stat-value">AED {stats.avgOrderValue}</span>
              <span className="stat-label">{t('manager.stats.avgOrder')}</span>
            </div>
          </div>
          <div className="stat-card cancelled">
            <span className="stat-icon">📉</span>
            <div className="stat-content">
              <span className="stat-value">{stats.cancellationRate}%</span>
              <span className="stat-label">{t('manager.stats.cancellationRate')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={t('manager.search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label={t('common.clear')}
            >
              ✕
            </button>
          )}
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
      </div>

      {/* Bookings List */}
      <div className="bookings-section">
        {loading ? (
          <div className="loading-state">
            <SkeletonList count={5} />
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
                        {sanitizePhoneUri(booking.customerData?.phone) ? (
                          <a href={`tel:${sanitizePhoneUri(booking.customerData.phone)}`} className="customer-phone">
                            {booking.customerData.phone}
                          </a>
                        ) : (
                          <span className="customer-phone">{booking.customerData?.phone || '-'}</span>
                        )}
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
                    <span className={`status-badge ${getStatusColor(booking.status || 'pending')}`}>
                      {t(`track.status.${booking.status || 'pending'}`)}
                    </span>
                  </span>
                  <span className="col-actions">
                    {updatingId === booking.id ? (
                      <span className="updating-spinner"></span>
                    ) : (
                      <div className="action-buttons" role="group" aria-label={t('manager.table.actions')}>
                        {/* Edit button - available for active orders */}
                        {!['completed', 'cancelled'].includes(booking.status) && (
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditBooking(booking)}
                            title={t('manager.editBooking') || 'Edit'}
                            aria-label={t('manager.editBooking') || 'Edit'}
                          >
                            ✏️
                          </button>
                        )}
                        {/* Progress button - move to next status */}
                        {STATUS_FLOW[booking.status] && (
                          <button
                            className={`action-btn progress status-${booking.status}`}
                            onClick={() => handleStatusUpdate(booking, STATUS_FLOW[booking.status].next)}
                            title={t(`manager.actions.${STATUS_FLOW[booking.status].action}`)}
                            aria-label={t(`manager.actions.${STATUS_FLOW[booking.status].action}`)}
                          >
                            {STATUS_FLOW[booking.status].icon}
                          </button>
                        )}
                        {/* Cancel button - available for active orders */}
                        {['pending', 'confirmed', 'on_the_way', 'in_progress'].includes(booking.status) && (
                          <button
                            className="action-btn cancel"
                            onClick={() => handleStatusUpdate(booking, 'cancelled')}
                            title={t('manager.actions.cancel')}
                            aria-label={t('manager.actions.cancel')}
                          >
                            ✕
                          </button>
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

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="modal-overlay" onClick={() => setEditingBooking(null)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <h3>{t('manager.editBooking') || 'Edit Booking'}</h3>
            <p className="edit-booking-id">#{editingBooking.id.slice(-6).toUpperCase()}</p>

            <div className="edit-form">
              <div className="form-row">
                <label>
                  <span>{t('manager.table.dateTime')}</span>
                  <div className="input-group">
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={e => setEditForm({...editForm, date: e.target.value})}
                    />
                    <input
                      type="text"
                      value={editForm.time}
                      onChange={e => setEditForm({...editForm, time: e.target.value})}
                      placeholder="14:00"
                    />
                  </div>
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>{t('manager.table.location')}</span>
                  <input
                    type="text"
                    value={editForm.area}
                    onChange={e => setEditForm({...editForm, area: e.target.value})}
                    placeholder={t('wizard.areaPlaceholder') || 'Area/Neighborhood'}
                  />
                  <input
                    type="text"
                    value={editForm.villa}
                    onChange={e => setEditForm({...editForm, villa: e.target.value})}
                    placeholder={t('wizard.villaPlaceholder') || 'Villa/House number'}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>{t('manager.table.price')}</span>
                  <div className="price-input">
                    <span className="currency">AED</span>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={e => setEditForm({...editForm, price: e.target.value})}
                      min="0"
                    />
                  </div>
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>{t('wizard.specialInstructions') || 'Notes'}</span>
                  <textarea
                    value={editForm.notes}
                    onChange={e => setEditForm({...editForm, notes: e.target.value})}
                    rows="3"
                    placeholder={t('wizard.instructionsPlaceholder') || 'Special instructions...'}
                  />
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setEditingBooking(null)}>
                {t('common.cancel')}
              </button>
              <button className="save-btn" onClick={handleSaveEdit} disabled={updatingId === editingBooking.id}>
                {updatingId === editingBooking.id ? '...' : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboardPage;
