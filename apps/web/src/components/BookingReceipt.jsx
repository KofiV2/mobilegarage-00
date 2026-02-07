import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { downloadReceiptPDF } from '../utils/pdfGenerator';
import './BookingReceipt.css';

/**
 * BookingReceipt Component
 *
 * Printable receipt for customer bookings.
 * Displays company info, booking details, and pricing.
 */
const BookingReceipt = forwardRef(({
  bookingId,
  booking,
  onPrint
}, ref) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-AE' : 'en-AE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time || typeof time !== 'string') return '-';
    const parts = time.split(':');
    if (parts.length < 2) return time;
    const [hours, minutes] = parts;
    const hour = parseInt(hours, 10);
    if (isNaN(hour)) return time;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await downloadReceiptPDF({
        bookingId,
        booking,
        language: i18n.language
      });
    } catch (error) {
      console.error('Failed to download PDF:', error);
      // Could add toast notification here
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`booking-receipt ${isRTL ? 'rtl' : ''}`} ref={ref}>
      {/* Action Buttons (hidden in print) */}
      <div className="receipt-actions no-print">
        <button className="print-button" onClick={handlePrint}>
          🖨️ {t('wizard.printReceipt')}
        </button>
        <button 
          className="download-pdf-button" 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
        >
          {isDownloading ? '⏳' : '📄'} {t('receipt.downloadPDF')}
        </button>
      </div>

      {/* Receipt Content */}
      <div className="receipt-content">
        {/* Header */}
        <div className="receipt-header">
          <div className="company-logo">🚐</div>
          <h1 className="company-name">{t('receipt.companyName')}</h1>
          <p className="receipt-title">{t('receipt.title')}</p>
        </div>

        {/* Booking ID */}
        <div className="booking-id-section">
          <span className="label">{t('receipt.bookingId')}</span>
          <span className="value">#{bookingId}</span>
        </div>

        {/* Divider */}
        <div className="receipt-divider"></div>

        {/* Details */}
        <div className="receipt-details">
          <div className="detail-row">
            <span className="label">{t('receipt.date')}</span>
            <span className="value">{formatDate(booking.date)}</span>
          </div>

          <div className="detail-row">
            <span className="label">{t('receipt.time')}</span>
            <span className="value">{formatTime(booking.time)}</span>
          </div>

          <div className="detail-row">
            <span className="label">{t('receipt.vehicle')}</span>
            <span className="value">
              {t(`wizard.${booking.vehicleType}`)}
              {booking.vehicleSize && ` (${t(`wizard.${booking.vehicleType}${booking.vehicleSize.charAt(0).toUpperCase() + booking.vehicleSize.slice(1)}`)})`}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">{t('receipt.package')}</span>
            <span className="value">{t(`packages.${booking.package}.name`)}</span>
          </div>

          <div className="detail-row">
            <span className="label">{t('receipt.location')}</span>
            <span className="value">
              {booking.area}
              {booking.villa && `, ${booking.villa}`}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">{t('receipt.payment')}</span>
            <span className="value">
              {booking.paymentMethod === 'cash' ? t('wizard.cash') : t('wizard.cardPayment')}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="receipt-divider"></div>

        {/* Total */}
        <div className="receipt-total">
          <span className="label">{t('receipt.total')}</span>
          <span className="value">AED {booking.price || '-'}</span>
        </div>

        {/* Footer */}
        <div className="receipt-footer">
          <p className="thank-you">{t('receipt.thankYou')}</p>
          <p className="contact">{t('receipt.contact')}</p>
        </div>
      </div>
    </div>
  );
});

BookingReceipt.displayName = 'BookingReceipt';

BookingReceipt.propTypes = {
  bookingId: PropTypes.string.isRequired,
  booking: PropTypes.shape({
    date: PropTypes.string,
    time: PropTypes.string,
    vehicleType: PropTypes.string,
    vehicleSize: PropTypes.string,
    package: PropTypes.string,
    area: PropTypes.string,
    villa: PropTypes.string,
    paymentMethod: PropTypes.string,
    price: PropTypes.number
  }).isRequired,
  onPrint: PropTypes.func
};

export default BookingReceipt;
