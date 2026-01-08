import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StaffTrackingMap from '../components/StaffTrackingMap';
import './BookingDetails.css';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTracking, setShowTracking] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      // In production: const response = await api.get(`/bookings/${id}`);
      // Mock booking data for now
      const mockBooking = {
        id: id,
        referenceNumber: `BK${String(id).padStart(6, '0')}`,
        service: {
          name: 'Premium Wash',
          category: 'home',
          price: 50
        },
        numberOfVehicles: 2,
        bookingDate: '2025-01-15',
        selectedTime: '10:00 AM',
        customerPhone: '+971 50 123 4567',
        customerAddress: '123 Main Street, Dubai, UAE',
        customerLocation: {
          lat: 25.2048,
          lng: 55.2708
        },
        paymentMethod: 'cash',
        totalPrice: 100,
        tax: 5,
        finalTotal: 105,
        status: 'confirmed',
        createdAt: '2025-01-10T08:30:00',
        notes: 'Please call when arriving'
      };

      setTimeout(() => {
        setBooking(mockBooking);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching booking:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#48bb78';
      case 'in_progress':
        return '#4299e1';
      case 'completed':
        return '#9f7aea';
      case 'cancelled':
        return '#e53e3e';
      default:
        return '#718096';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return '✓';
      case 'in_progress':
        return '🚗';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '✕';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="booking-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="booking-details-page">
        <div className="error-container">
          <h2>Booking Not Found</h2>
          <p>The booking you're looking for doesn't exist.</p>
          <button className="btn-primary" onClick={() => navigate('/customer/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-details-page">
      <div className="details-header">
        <button className="back-btn" onClick={() => navigate('/customer/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Booking Details</h1>
      </div>

      <div className="details-container">
        {/* Status Card */}
        <div className="status-card">
          <div className="status-badge" style={{ background: getStatusColor(booking.status) }}>
            <span className="status-icon">{getStatusIcon(booking.status)}</span>
            <span className="status-text">{booking.status.toUpperCase()}</span>
          </div>
          <div className="reference-number">
            <span className="ref-label">Reference Number:</span>
            <span className="ref-value">{booking.referenceNumber}</span>
          </div>
        </div>

        {/* Service Information */}
        <div className="info-section">
          <h3>Service Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="item-label">Service</span>
              <span className="item-value">{booking.service.name}</span>
            </div>
            <div className="info-item">
              <span className="item-label">Type</span>
              <span className="item-value">
                {booking.service.category === 'home' ? '🏠 Home Service' : '🏢 In-Place'}
              </span>
            </div>
            <div className="info-item">
              <span className="item-label">Number of Vehicles</span>
              <span className="item-value">{booking.numberOfVehicles}</span>
            </div>
            <div className="info-item">
              <span className="item-label">Price per Vehicle</span>
              <span className="item-value">AED {booking.service.price}</span>
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="info-section">
          <h3>Schedule</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="item-label">Date</span>
              <span className="item-value">📅 {new Date(booking.bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="info-item">
              <span className="item-label">Time</span>
              <span className="item-value">🕒 {booking.selectedTime}</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="info-section">
          <h3>Contact Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="item-label">Phone Number</span>
              <span className="item-value">📱 {booking.customerPhone}</span>
            </div>
            {booking.service.category === 'home' && (
              <div className="info-item full-width">
                <span className="item-label">Service Address</span>
                <span className="item-value">📍 {booking.customerAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="info-section">
          <h3>Payment Summary</h3>
          <div className="payment-breakdown">
            <div className="payment-row">
              <span>Subtotal ({booking.numberOfVehicles} vehicles)</span>
              <span>AED {booking.totalPrice}</span>
            </div>
            <div className="payment-row">
              <span>Tax (5%)</span>
              <span>AED {booking.tax}</span>
            </div>
            <div className="payment-row total">
              <span>Total Amount</span>
              <span>AED {booking.finalTotal}</span>
            </div>
            <div className="payment-method">
              <span className="method-label">Payment Method:</span>
              <span className="method-value">
                {booking.paymentMethod === 'cash' && '💵 Cash on Service'}
                {booking.paymentMethod === 'card' && '💳 Credit Card'}
                {booking.paymentMethod === 'wallet' && '📱 Digital Wallet'}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        {booking.notes && (
          <div className="info-section">
            <h3>Special Instructions</h3>
            <p className="notes-text">{booking.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          {booking.service.category === 'home' && booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <button className="btn-track" onClick={() => setShowTracking(true)}>
              📍 Track Staff Location
            </button>
          )}

          {booking.status === 'confirmed' && (
            <>
              <button className="btn-reschedule">
                📅 Reschedule Booking
              </button>
              <button className="btn-cancel">
                ✕ Cancel Booking
              </button>
            </>
          )}

          {booking.status === 'completed' && (
            <button className="btn-review">
              ⭐ Leave a Review
            </button>
          )}
        </div>
      </div>

      {/* Staff Tracking Map Modal */}
      {showTracking && booking.customerLocation && (
        <StaffTrackingMap
          bookingId={booking.id}
          customerLocation={booking.customerLocation}
          onClose={() => setShowTracking(false)}
        />
      )}
    </div>
  );
};

export default BookingDetails;
