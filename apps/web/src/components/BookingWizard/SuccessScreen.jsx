import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { PACKAGES, VEHICLE_TYPES } from '../../config/packages';
import BookingReceipt from '../BookingReceipt';

const SuccessScreen = memo(function SuccessScreen({
  booking,
  savedBookingId,
  isReschedule,
  isGuest,
  selectedAddOns,
  getPrice,
  getAddOnsPrice,
  getTotalPrice,
  onClose,
  onSignIn,
}) {
  const { t } = useTranslation();

  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div className="wizard-container success-container" onClick={(e) => e.stopPropagation()}>
        <button className="wizard-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className="success-content">
          <div className="success-icon">✓</div>
          <h2 className="success-title">
            {isReschedule ? t('wizard.bookingRescheduled') : t('wizard.bookingConfirmed')}
          </h2>
          {savedBookingId && (
            <div className="booking-id">
              <span>{t('wizard.bookingId')}: </span>
              <strong>#{savedBookingId}</strong>
            </div>
          )}

          {/* Booking Summary */}
          <div className="booking-summary-success">
            <div className="summary-row">
              <span>📦 {t('wizard.step2')}:</span>
              <strong>{PACKAGES[booking.package]?.name || booking.package}</strong>
            </div>
            <div className="summary-row">
              <span>🚗 {t('wizard.step1')}:</span>
              <strong>{VEHICLE_TYPES[booking.vehicleType]?.label || booking.vehicleType}</strong>
            </div>
            <div className="summary-row">
              <span>📅 {t('wizard.step3')}:</span>
              <strong>{booking.date} - {booking.time}</strong>
            </div>
            <div className="summary-row">
              <span>📍 {t('wizard.step4')}:</span>
              <strong>{booking.area}{booking.villa ? `, ${booking.villa}` : ''}</strong>
            </div>
            <div className="summary-row">
              <span>💰 {t('wizard.total')}:</span>
              <strong>AED {getTotalPrice()}</strong>
            </div>
          </div>

          <p className="success-message">{t('wizard.bookingSubmitted')}</p>

          {/* Print Receipt */}
          <BookingReceipt
            bookingId={savedBookingId}
            booking={{
              date: booking.date,
              time: booking.time,
              vehicleType: booking.vehicleType,
              vehicleSize: booking.vehicleSize,
              package: booking.package,
              area: booking.area,
              villa: booking.villa,
              paymentMethod: booking.paymentMethod,
              price: getPrice(),
              addOns: selectedAddOns,
              addOnsPrice: getAddOnsPrice(),
              totalPrice: getTotalPrice()
            }}
          />

          <button
            className="wizard-btn btn-primary success-button"
            onClick={onClose}
          >
            {t('wizard.done')}
          </button>

          {/* Show sign-in option for guests */}
          {isGuest && (
            <div className="guest-signup-prompt">
              <p>{t('guest.signInPrompt') || 'Sign in to track your bookings'}</p>
              <button
                className="wizard-btn btn-secondary"
                onClick={onSignIn}
              >
                {t('nav.signIn') || 'Sign In'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SuccessScreen;
