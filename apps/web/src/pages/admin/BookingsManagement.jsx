import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TableSkeleton, StatCardSkeleton } from '../../components/SkeletonLoader';
import Skeleton from 'react-loading-skeleton';
import Pagination from '../../components/Pagination';
import { showErrorNotification, showSuccessNotification } from '../../components/ErrorNotification';
import { getApiUrl } from '../../services/api';
import './BookingsManagement.css';

const BookingsManagement = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Separate state for input
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchBookings();
  }, [user, navigate, currentPage, pageSize, searchTerm, filterStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(getApiUrl(`/admin/bookings?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();

      if (!data || !data.data) {
        throw new Error('Invalid response format');
      }

      const formattedBookings = data.data.map(b => ({
        id: b.id,
        bookingNumber: b.booking_number,
        customer: `${b.users?.first_name || ''} ${b.users?.last_name || ''}`.trim() || 'N/A',
        service: b.services?.name || 'N/A',
        vehicle: `${b.vehicles?.make || ''} ${b.vehicles?.model || ''} - ${b.vehicles?.license_plate || ''}`.replace(/^\s*-\s*$/, 'N/A'),
        date: b.scheduled_date,
        time: b.scheduled_time,
        status: b.status,
        amount: parseFloat(b.total_price) || 0,
        paymentStatus: b.payment_status
      }));

      setBookings(formattedBookings);
      setTotalItems(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(error.message || 'Failed to fetch bookings');
      showErrorNotification('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/admin/bookings/${bookingId}/status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      showSuccessNotification('Booking status updated successfully!');
      // Refresh bookings list
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      showErrorNotification('Failed to update booking status. Please try again.');
    }
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      in_progress: 'status-progress',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return colors[status] || '';
  };

  const getStatusLabel = (status) => {
    return t(`bookings.status.${status}`);
  };

  // Use totalItems from server for accurate count, and calculate visible stats from current page
  const stats = {
    total: totalItems, // Total from server (all pages)
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    inProgress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.amount, 0)
  };

  if (loading) {
    return (
      <div className="bookings-management">
        <div className="page-header">
          <div>
            <h1>📅 {t('admin.bookings.title')}</h1>
            <p>{t('admin.bookings.description')}</p>
          </div>
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            ← {t('admin.bookings.backToDashboard')}
          </button>
        </div>

        <div className="bookings-stats">
          <div className="stat-mini">
            <span className="stat-label"><Skeleton width={100} /></span>
            <span className="stat-value"><Skeleton width={40} /></span>
          </div>
          <div className="stat-mini">
            <span className="stat-label"><Skeleton width={100} /></span>
            <span className="stat-value"><Skeleton width={40} /></span>
          </div>
          <div className="stat-mini">
            <span className="stat-label"><Skeleton width={100} /></span>
            <span className="stat-value"><Skeleton width={40} /></span>
          </div>
          <div className="stat-mini">
            <span className="stat-label"><Skeleton width={100} /></span>
            <span className="stat-value"><Skeleton width={40} /></span>
          </div>
          <div className="stat-mini">
            <span className="stat-label"><Skeleton width={100} /></span>
            <span className="stat-value"><Skeleton width={40} /></span>
          </div>
          <div className="stat-mini">
            <span className="stat-label"><Skeleton width={120} /></span>
            <span className="stat-value"><Skeleton width={80} /></span>
          </div>
        </div>

        <div className="bookings-controls">
          <div className="search-box">
            <input type="text" placeholder={t('admin.bookings.searchPlaceholder')} disabled />
            <span className="search-icon">🔍</span>
          </div>
          <div className="filter-group">
            <label>{t('admin.bookings.filter')}:</label>
            <select disabled>
              <option value="all">{t('admin.bookings.allStatus')}</option>
            </select>
          </div>
        </div>

        <div className="bookings-table-container">
          <TableSkeleton rows={10} columns={9} />
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-management">
      <div className="page-header">
        <div>
          <h1>📅 {t('admin.bookings.title')}</h1>
          <p>{t('admin.bookings.description')}</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
          ← {t('admin.bookings.backToDashboard')}
        </button>
      </div>

      <div className="bookings-stats">
        <div className="stat-mini stat-total">
          <span className="stat-label">{t('admin.bookings.totalBookings')}</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-mini stat-pending">
          <span className="stat-label">{t('bookings.status.pending')}</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-mini stat-confirmed">
          <span className="stat-label">{t('bookings.status.confirmed')}</span>
          <span className="stat-value">{stats.confirmed}</span>
        </div>
        <div className="stat-mini stat-progress">
          <span className="stat-label">{t('bookings.status.in_progress')}</span>
          <span className="stat-value">{stats.inProgress}</span>
        </div>
        <div className="stat-mini stat-completed">
          <span className="stat-label">{t('bookings.status.completed')}</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
        <div className="stat-mini stat-revenue">
          <span className="stat-label">{t('admin.bookings.revenue')}</span>
          <span className="stat-value">AED {stats.totalRevenue}</span>
        </div>
      </div>

      <div className="bookings-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('admin.bookings.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-group">
          <label>{t('admin.bookings.filter')}:</label>
          <select value={filterStatus} onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1); // Reset to first page when filtering
          }}>
            <option value="all">{t('admin.bookings.allStatus')}</option>
            <option value="pending">{t('bookings.status.pending')}</option>
            <option value="confirmed">{t('bookings.status.confirmed')}</option>
            <option value="in_progress">{t('bookings.status.in_progress')}</option>
            <option value="completed">{t('bookings.status.completed')}</option>
            <option value="cancelled">{t('bookings.status.cancelled')}</option>
          </select>
        </div>
      </div>

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>{t('admin.bookings.bookingNumber')}</th>
              <th>{t('admin.bookings.customer')}</th>
              <th>{t('admin.bookings.service')}</th>
              <th>{t('admin.bookings.vehicle')}</th>
              <th>{t('admin.bookings.dateTime')}</th>
              <th>{t('admin.bookings.status')}</th>
              <th>{t('admin.bookings.payment')}</th>
              <th>{t('admin.bookings.amount')}</th>
              <th>{t('admin.bookings.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                  {t('admin.bookings.noBookings')}
                </td>
              </tr>
            ) : (
              bookings.map(booking => (
              <tr key={booking.id}>
                <td className="booking-number">{booking.bookingNumber}</td>
                <td className="customer-name">{booking.customer}</td>
                <td>{booking.service}</td>
                <td className="vehicle-info">{booking.vehicle}</td>
                <td>
                  <div className="datetime">
                    <div>{new Date(booking.date).toLocaleDateString()}</div>
                    <div className="time">{booking.time}</div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </td>
                <td>
                  <span className={`payment-badge payment-${booking.paymentStatus}`}>
                    {booking.paymentStatus}
                  </span>
                </td>
                <td className="amount">AED {booking.amount}</td>
                <td className="actions-cell">
                  <button
                    className="action-icon-btn view"
                    onClick={() => handleViewBooking(booking)}
                    title={t('admin.bookings.viewDetails')}
                  >
                    👁️
                  </button>
                  {booking.status === 'pending' && (
                    <button
                      className="action-icon-btn confirm"
                      onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                      title={t('admin.bookings.confirm')}
                    >
                      ✅
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      className="action-icon-btn start"
                      onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                      title={t('admin.bookings.start')}
                    >
                      ▶️
                    </button>
                  )}
                  {booking.status === 'in_progress' && (
                    <button
                      className="action-icon-btn complete"
                      onClick={() => handleUpdateStatus(booking.id, 'completed')}
                      title={t('admin.bookings.complete')}
                    >
                      🏁
                    </button>
                  )}
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {showModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('admin.bookings.bookingDetailsTitle')} - {selectedBooking.bookingNumber}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="booking-detail-grid">
                <div className="detail-section">
                  <h3>{t('admin.bookings.customerInformation')}</h3>
                  <div className="detail-item">
                    <label>{t('admin.bookings.name')}:</label>
                    <p>{selectedBooking.customer}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>{t('admin.bookings.serviceDetails')}</h3>
                  <div className="detail-item">
                    <label>{t('admin.bookings.service')}:</label>
                    <p>{selectedBooking.service}</p>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.bookings.vehicle')}:</label>
                    <p>{selectedBooking.vehicle}</p>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.bookings.dateTime')}:</label>
                    <p>{new Date(selectedBooking.date).toLocaleDateString()} {t('admin.bookings.at')} {selectedBooking.time}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>{t('admin.bookings.statusPayment')}</h3>
                  <div className="detail-item">
                    <label>{t('admin.bookings.status')}:</label>
                    <p className={`status-badge ${getStatusColor(selectedBooking.status)}`}>
                      {getStatusLabel(selectedBooking.status)}
                    </p>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.bookings.paymentStatus')}:</label>
                    <p className={`payment-badge payment-${selectedBooking.paymentStatus}`}>
                      {selectedBooking.paymentStatus}
                    </p>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.bookings.amount')}:</label>
                    <p className="amount-large">AED {selectedBooking.amount}</p>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                {selectedBooking.status === 'pending' && (
                  <button
                    className="btn-confirm"
                    onClick={() => {
                      handleUpdateStatus(selectedBooking.id, 'confirmed');
                      setShowModal(false);
                    }}
                  >
                    ✅ {t('admin.bookings.confirmBooking')}
                  </button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button
                    className="btn-start"
                    onClick={() => {
                      handleUpdateStatus(selectedBooking.id, 'in_progress');
                      setShowModal(false);
                    }}
                  >
                    ▶️ {t('admin.bookings.startService')}
                  </button>
                )}
                {selectedBooking.status === 'in_progress' && (
                  <button
                    className="btn-complete"
                    onClick={() => {
                      handleUpdateStatus(selectedBooking.id, 'completed');
                      setShowModal(false);
                    }}
                  >
                    🏁 {t('admin.bookings.completeService')}
                  </button>
                )}
                <button className="btn-cancel" onClick={() => setShowModal(false)}>
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsManagement;
