import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, limit, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useManagerAuth } from '../../contexts/ManagerAuthContext';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { escapeHtml } from '../../utils/sanitize';
import logger from '../../utils/logger';
import { DEFAULT_ADDONS } from '../../config/packages';
import StatsSection from './StatsSection';
import BookingsTable from './BookingsTable';
import TimeSlotManager from './TimeSlotManager';
import AddOnsManager from './AddOnsManager';
import PromoCodesManager from './PromoCodesManager';
import EditBookingModal from './EditBookingModal';
import StaffScheduler from './StaffScheduler';
import '../ManagerDashboardPage.css';

// Generate all possible time slots from 12 PM to 12 AM (needed for closeAllSlots)
const ALL_TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = 12; hour <= 23; hour++) {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    slots.push({
      id: `${hour}:00`,
      label: `${displayHour}:00 ${period}`,
      hour: hour
    });
  }
  // Add 12 AM (midnight)
  slots.push({
    id: '24:00',
    label: '12:00 AM',
    hour: 24
  });
  return slots;
})();

const DATE_RANGES = ['today', 'week', 'month', 'all'];

const ManagerDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { manager, managerLogout } = useManagerAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize state from URL params or defaults
  const [activeFilter, setActiveFilter] = useState(searchParams.get('status') || 'all');
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') || 'all');
  const [dateRange, setDateRange] = useState(searchParams.get('range') || 'today');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [packageFilter, setPackageFilter] = useState(searchParams.get('package') || 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showTimeSlotManager, setShowTimeSlotManager] = useState(false);
  const [showFullAnalytics, setShowFullAnalytics] = useState(false);
  const [closedSlots, setClosedSlots] = useState({});
  const [selectedSlotDate, setSelectedSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingSlots, setSavingSlots] = useState(false);
  const [showAddOnsManager, setShowAddOnsManager] = useState(false);
  const [showPromoManager, setShowPromoManager] = useState(false);
  const [showStaffScheduler, setShowStaffScheduler] = useState(false);
  const [addOnsConfig, setAddOnsConfig] = useState({});
  const [savingAddOns, setSavingAddOns] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    cancellationRate: 0,
    staffOrders: 0,
    customerOrders: 0,
    // Extended analytics
    confirmedCount: 0,
    onTheWayCount: 0,
    inProgressCount: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    sedanCount: 0,
    suvCount: 0,
    otherVehicleCount: 0,
    platinumCount: 0,
    titaniumCount: 0,
    diamondCount: 0
  });

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Sync filters to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilter !== 'all') params.set('status', activeFilter);
    if (sourceFilter !== 'all') params.set('source', sourceFilter);
    if (dateRange !== 'today') params.set('range', dateRange);
    if (searchQuery) params.set('search', searchQuery);
    if (packageFilter !== 'all') params.set('package', packageFilter);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    
    setSearchParams(params, { replace: true });
  }, [activeFilter, sourceFilter, dateRange, searchQuery, packageFilter, dateFrom, dateTo, setSearchParams]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilter('all');
    setSourceFilter('all');
    setDateRange('today');
    setSearchQuery('');
    setPackageFilter('all');
    setDateFrom('');
    setDateTo('');
  }, []);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return activeFilter !== 'all' || 
           sourceFilter !== 'all' || 
           dateRange !== 'today' || 
           searchQuery.trim() !== '' || 
           packageFilter !== 'all' ||
           dateFrom !== '' ||
           dateTo !== '';
  }, [activeFilter, sourceFilter, dateRange, searchQuery, packageFilter, dateFrom, dateTo]);

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
    const completedBookings = filtered.filter(b => b.status === 'completed');
    const completedCount = completedBookings.length;
    const cancelledCount = filtered.filter(b => b.status === 'cancelled').length;
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);

    // Extended analytics
    const cashBookings = completedBookings.filter(b => b.paymentMethod === 'cash');
    const cardBookings = completedBookings.filter(b => b.paymentMethod !== 'cash');

    setStats({
      totalOrders,
      pendingCount: filtered.filter(b => b.status === 'pending').length,
      confirmedCount: filtered.filter(b => b.status === 'confirmed').length,
      onTheWayCount: filtered.filter(b => b.status === 'on_the_way').length,
      inProgressCount: filtered.filter(b => b.status === 'in_progress').length,
      completedCount,
      cancelledCount,
      totalRevenue,
      avgOrderValue: completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0,
      cancellationRate: totalOrders > 0 ? ((cancelledCount / totalOrders) * 100).toFixed(1) : 0,
      staffOrders: filtered.filter(b => b.source === 'staff').length,
      customerOrders: filtered.filter(b => b.source !== 'staff').length,
      // Extended analytics
      cashRevenue: cashBookings.reduce((sum, b) => sum + (b.price || 0), 0),
      cardRevenue: cardBookings.reduce((sum, b) => sum + (b.price || 0), 0),
      sedanCount: filtered.filter(b => b.vehicleType === 'sedan').length,
      suvCount: filtered.filter(b => b.vehicleType === 'suv').length,
      otherVehicleCount: filtered.filter(b => !['sedan', 'suv'].includes(b.vehicleType)).length,
      platinumCount: filtered.filter(b => b.package === 'platinum').length,
      titaniumCount: filtered.filter(b => b.package === 'titanium').length,
      diamondCount: filtered.filter(b => b.package === 'diamond').length
    });
  };

  // Fetch closed slots configuration
  const fetchClosedSlots = useCallback(async () => {
    if (!db) return;
    try {
      const configDoc = await getDoc(doc(db, 'config', 'timeSlots'));
      if (configDoc.exists()) {
        setClosedSlots(configDoc.data().closedSlots || {});
      }
    } catch (error) {
      logger.error('Error fetching closed slots', error);
    }
  }, []);

  // Save closed slots configuration
  const saveClosedSlots = async (newClosedSlots) => {
    setSavingSlots(true);
    try {
      await setDoc(doc(db, 'config', 'timeSlots'), {
        closedSlots: newClosedSlots,
        updatedAt: serverTimestamp(),
        updatedBy: manager?.email || 'manager'
      }, { merge: true });
      setClosedSlots(newClosedSlots);
      showToast(t('manager.timeSlots.saved'), 'success');
    } catch (error) {
      logger.error('Error saving closed slots', error);
      showToast(t('manager.timeSlots.saveError'), 'error');
    } finally {
      setSavingSlots(false);
    }
  };

  // Toggle a time slot (open/close)
  const toggleTimeSlot = (slotId) => {
    const dateSlots = closedSlots[selectedSlotDate] || [];
    const newDateSlots = dateSlots.includes(slotId)
      ? dateSlots.filter(id => id !== slotId)
      : [...dateSlots, slotId];

    const newClosedSlots = {
      ...closedSlots,
      [selectedSlotDate]: newDateSlots
    };

    // Clean up empty dates
    if (newDateSlots.length === 0) {
      delete newClosedSlots[selectedSlotDate];
    }

    saveClosedSlots(newClosedSlots);
  };

  // Close all slots for a date
  const closeAllSlots = () => {
    const allSlotIds = ALL_TIME_SLOTS.map(slot => slot.id);
    saveClosedSlots({
      ...closedSlots,
      [selectedSlotDate]: allSlotIds
    });
  };

  // Open all slots for a date
  const openAllSlots = () => {
    const newClosedSlots = { ...closedSlots };
    delete newClosedSlots[selectedSlotDate];
    saveClosedSlots(newClosedSlots);
  };

  // Fetch add-ons configuration
  const fetchAddOnsConfig = useCallback(async () => {
    if (!db) return;
    try {
      const configDoc = await getDoc(doc(db, 'config', 'addOns'));
      if (configDoc.exists()) {
        setAddOnsConfig(configDoc.data().addOns || {});
      } else {
        // Initialize with defaults
        const defaultConfig = {};
        DEFAULT_ADDONS.forEach(addon => {
          defaultConfig[addon.id] = {
            price: addon.defaultPrice,
            enabled: true,
            ...(addon.presetAmounts && { presetAmounts: addon.presetAmounts })
          };
        });
        setAddOnsConfig(defaultConfig);
      }
    } catch (error) {
      logger.error('Error fetching add-ons config', error);
    }
  }, []);

  // Save add-ons configuration
  const saveAddOnsConfig = async (newConfig) => {
    setSavingAddOns(true);
    try {
      await setDoc(doc(db, 'config', 'addOns'), {
        addOns: newConfig,
        updatedAt: serverTimestamp(),
        updatedBy: manager?.email || 'manager'
      }, { merge: true });
      setAddOnsConfig(newConfig);
      showToast(t('manager.addOns.saved') || 'Add-ons configuration saved', 'success');
    } catch (error) {
      logger.error('Error saving add-ons config', error);
      showToast(t('manager.addOns.saveError') || 'Failed to save add-ons', 'error');
    } finally {
      setSavingAddOns(false);
    }
  };

  // Update a single add-on price
  const updateAddOnPrice = (addonId, price) => {
    const newConfig = {
      ...addOnsConfig,
      [addonId]: {
        ...addOnsConfig[addonId],
        price: Number(price) || 0
      }
    };
    setAddOnsConfig(newConfig);
  };

  // Toggle add-on enabled state
  const toggleAddOnEnabled = (addonId) => {
    const newConfig = {
      ...addOnsConfig,
      [addonId]: {
        ...addOnsConfig[addonId],
        enabled: !addOnsConfig[addonId]?.enabled
      }
    };
    saveAddOnsConfig(newConfig);
  };

  // Fetch closed slots and add-ons on mount
  useEffect(() => {
    fetchClosedSlots();
    fetchAddOnsConfig();
  }, [fetchClosedSlots, fetchAddOnsConfig]);

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

  // Filter bookings based on all filters (memoized)
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Status filter
      const statusMatch = activeFilter === 'all' || b.status === activeFilter;
      
      // Source filter
      const sourceMatch = sourceFilter === 'all' ||
        (sourceFilter === 'staff' && b.source === 'staff') ||
        (sourceFilter === 'customer' && b.source !== 'staff');

      // Search filter - match phone, name, or booking ID
      const searchLower = searchQuery.trim().toLowerCase();
      const searchMatch = !searchLower ||
        b.customerData?.phone?.includes(searchQuery.trim()) ||
        b.customerData?.name?.toLowerCase().includes(searchLower) ||
        b.id?.toLowerCase().includes(searchLower);

      // Package filter
      const packageMatch = packageFilter === 'all' || b.package === packageFilter;

      // Custom date range filter (overrides dateRange preset when both from/to are set)
      let dateMatch = true;
      if (dateFrom || dateTo) {
        const bookingDate = b.date;
        if (dateFrom && bookingDate < dateFrom) dateMatch = false;
        if (dateTo && bookingDate > dateTo) dateMatch = false;
      }

      return statusMatch && sourceMatch && searchMatch && packageMatch && dateMatch;
    });
  }, [bookings, activeFilter, sourceFilter, searchQuery, packageFilter, dateFrom, dateTo]);

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
            ${filteredBookings.map(b => {
              const statusLabel = t('track.status.' + (b.status || 'pending'));
              return '<tr>' +
                '<td>' + escapeHtml(b.id?.slice(-6)?.toUpperCase()) + '</td>' +
                '<td>' + (escapeHtml(b.customerData?.name) || '-') + '<br/>' + (escapeHtml(b.customerData?.phone) || '') + '</td>' +
                '<td>' + (escapeHtml(b.vehicleType) || '-') + '<br/>' + (escapeHtml(b.package) || '') + '</td>' +
                '<td>' + (escapeHtml(b.date) || '-') + '<br/>' + (escapeHtml(b.time) || '') + '</td>' +
                '<td>' + (escapeHtml(b.location?.area) || '-') + '<br/>' + (escapeHtml(b.location?.villa) || '') + '</td>' +
                '<td>AED ' + (escapeHtml(b.price) || 0) + '</td>' +
                '<td>' + escapeHtml(statusLabel) + '</td>' +
              '</tr>';
            }).join('')}
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
      package: booking.package || '',
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
      const updateData = {
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
      };
      
      // Include package if it was changed
      if (editForm.package && editForm.package !== editingBooking.package) {
        updateData.package = editForm.package;
        updateData.packageChanged = true;
        updateData.previousPackage = editingBooking.package;
      }
      
      await updateDoc(bookingRef, updateData);
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
            <button
              className="time-slots-btn"
              onClick={() => setShowTimeSlotManager(true)}
              title={t('manager.timeSlots.title')}
            >
              {'\uD83D\uDD50'} {t('manager.timeSlots.title')}
            </button>
            <button
              className="addons-manager-btn"
              onClick={() => setShowAddOnsManager(true)}
              title={t('manager.addOns.title') || 'Add-ons Pricing'}
            >
              {'\uD83C\uDF81'} {t('manager.addOns.title') || 'Add-ons'}
            </button>
            <button
              className="promo-codes-btn"
              onClick={() => setShowPromoManager(true)}
              title={t('promoManager.title') || 'Promo Codes'}
            >
              🎟️ {t('promoManager.title') || 'Promos'}
            </button>
            <button
              className="staff-scheduler-btn"
              onClick={() => setShowStaffScheduler(true)}
              title={t('staff.scheduler') || 'Staff Scheduler'}
            >
              📅 {t('staff.scheduler') || 'Staff'}
            </button>
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
            {'\uD83D\uDCE5'} CSV
          </button>
          <button className="export-btn pdf" onClick={handleExportPDF} disabled={filteredBookings.length === 0}>
            {'\uD83D\uDCC4'} PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsSection
        stats={stats}
        showFullAnalytics={showFullAnalytics}
        setShowFullAnalytics={setShowFullAnalytics}
      />

      {/* Search, Filters, and Bookings Table */}
      <BookingsTable
        loading={loading}
        bookings={bookings}
        filteredBookings={filteredBookings}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        packageFilter={packageFilter}
        setPackageFilter={setPackageFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        hasActiveFilters={hasActiveFilters}
        clearAllFilters={clearAllFilters}
        updatingId={updatingId}
        formatDate={formatDate}
        handleStatusUpdate={handleStatusUpdate}
        handleEditBooking={handleEditBooking}
        openImageModal={openImageModal}
      />

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeImageModal}>{'\u2715'}</button>
            <img src={selectedImage} alt={t('manager.vehiclePhoto')} />
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      <EditBookingModal
        editingBooking={editingBooking}
        editForm={editForm}
        setEditForm={setEditForm}
        updatingId={updatingId}
        onClose={() => setEditingBooking(null)}
        onSave={handleSaveEdit}
      />

      {/* Time Slot Manager Modal */}
      <TimeSlotManager
        show={showTimeSlotManager}
        onClose={() => setShowTimeSlotManager(false)}
        bookings={bookings}
        closedSlots={closedSlots}
        selectedSlotDate={selectedSlotDate}
        setSelectedSlotDate={setSelectedSlotDate}
        savingSlots={savingSlots}
        toggleTimeSlot={toggleTimeSlot}
        openAllSlots={openAllSlots}
        closeAllSlots={closeAllSlots}
      />

      {/* Add-ons Manager Modal */}
      <AddOnsManager
        show={showAddOnsManager}
        onClose={() => setShowAddOnsManager(false)}
        addOnsConfig={addOnsConfig}
        savingAddOns={savingAddOns}
        updateAddOnPrice={updateAddOnPrice}
        toggleAddOnEnabled={toggleAddOnEnabled}
        saveAddOnsConfig={saveAddOnsConfig}
      />

      <PromoCodesManager
        show={showPromoManager}
        onClose={() => setShowPromoManager(false)}
      />

      {/* Staff Scheduler Modal */}
      {showStaffScheduler && (
        <StaffScheduler
          onClose={() => setShowStaffScheduler(false)}
        />
      )}
    </div>
  );
};

export default ManagerDashboardPage;
