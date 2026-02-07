import React, { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PACKAGES, VEHICLE_TYPES } from '../../config/packages';
import BookingReceipt from '../BookingReceipt';
import Confetti from '../Confetti';
import WhatsAppShareButton from '../WhatsAppShareButton';
import { haptic } from '../../utils/haptics';

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
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Focus trap for modal accessibility
  const dialogRef = useFocusTrap(true, {
    autoFocus: true,
    restoreFocus: true,
    initialFocusSelector: '.success-button'
  });

  // Announce success to screen readers
  const announcementRef = useRef(null);
  useEffect(() => {
    // Focus the announcement for screen readers
    if (announcementRef.current) {
      announcementRef.current.focus();
    }
    
    // Trigger haptic feedback for celebration!
    haptic('success');
    
    // Trigger confetti celebration (slight delay for dramatic effect)
    const timer = setTimeout(() => setShowConfetti(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="wizard-overlay" onClick={onClose} role="presentation">
      {/* Celebration confetti! */}
      <Confetti active={showConfetti} pieces={80} duration={3500} />
      
      <div 
        ref={dialogRef}
        className="wizard-container success-container" 
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="success-title"
        aria-describedby="success-message"
      >
        <button 
          className="wizard-close" 
          onClick={onClose} 
          aria-label={t('common.close') || 'Close confirmation'}
        >
          <span aria-hidden="true">&times;</span>
        </button>
        
        <div className="success-content">
          {/* Screen reader announcement */}
          <div 
            ref={announcementRef}
            role="status" 
            aria-live="assertive" 
            aria-atomic="true"
            className="sr-only"
            tabIndex={-1}
          >
            {isReschedule ? t('wizard.bookingRescheduled') : t('wizard.bookingConfirmed')}.
            {savedBookingId && ` ${t('wizard.bookingId')}: ${savedBookingId}.`}
            {t('wizard.bookingSubmitted')}
          </div>

          <div className="success-icon" aria-hidden="true">✓</div>
          <h2 id="success-title" className="success-title">
            {isReschedule ? t('wizard.bookingRescheduled') : t('wizard.bookingConfirmed')}
          </h2>
          {savedBookingId && (
            <div className="booking-id">
              <span>{t('wizard.bookingId')}: </span>
              <strong aria-label={`Booking ID: ${savedBookingId}`}>#{savedBookingId}</strong>
            </div>
          )}

          {/* Booking Summary */}
          <div 
            className="booking-summary-success" 
            role="region" 
            aria-label={t('wizard.bookingSummary') || 'Booking summary'}
          >
            <dl className="summary-list">
              <div className="summary-row">
                <dt><span aria-hidden="true">📦</span> {t('wizard.step2')}:</dt>
                <dd>{PACKAGES[booking.package]?.name || booking.package}</dd>
              </div>
              <div className="summary-row">
                <dt><span aria-hidden="true">🚗</span> {t('wizard.step1')}:</dt>
                <dd>{VEHICLE_TYPES[booking.vehicleType]?.label || booking.vehicleType}</dd>
              </div>
              <div className="summary-row">
                <dt><span aria-hidden="true">📅</span> {t('wizard.step3')}:</dt>
                <dd>{booking.date} - {booking.time}</dd>
              </div>
              <div className="summary-row">
                <dt><span aria-hidden="true">📍</span> {t('wizard.step4')}:</dt>
                <dd>{booking.area}{booking.villa ? `, ${booking.villa}` : ''}</dd>
              </div>
              <div className="summary-row">
                <dt><span aria-hidden="true">💰</span> {t('wizard.total')}:</dt>
                <dd><strong>AED {getTotalPrice()}</strong></dd>
              </div>
            </dl>
          </div>

          <p id="success-message" className="success-message">{t('wizard.bookingSubmitted')}</p>

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

          {/* Share on WhatsApp */}
          <WhatsAppShareButton
            bookingId={savedBookingId?.slice(-6).toUpperCase()}
            packageName={PACKAGES[booking.package]?.name || booking.package}
            date={booking.date}
            time={booking.time}
            location={`${booking.area}${booking.villa ? `, ${booking.villa}` : ''}`}
            variant="secondary"
            fullWidth
            className="success-share-btn"
          />

          <button
            className="wizard-btn btn-primary success-button"
            onClick={onClose}
            aria-label={t('wizard.doneAndClose') || 'Done - close this dialog'}
          >
            {t('wizard.done')}
          </button>

          {/* Show sign-in option for guests */}
          {isGuest && (
            <div className="guest-signup-prompt" role="region" aria-label={t('guest.signInSection') || 'Sign in options'}>
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
