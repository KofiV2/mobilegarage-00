import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PaymentMethodToggle - Cash / Payment Link toggle buttons.
 * Rendered in the quick-entry section of the form.
 */
export const PaymentMethodToggle = ({ paymentMethod, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="quick-section">
      <div className="payment-toggle">
        <button
          type="button"
          className={`payment-btn ${paymentMethod === 'cash' ? 'selected' : ''}`}
          onClick={() => onChange('paymentMethod', 'cash')}
        >
          💵 {t('staff.orderForm.cash')}
        </button>
        <button
          type="button"
          className={`payment-btn ${paymentMethod === 'link' ? 'selected' : ''}`}
          onClick={() => onChange('paymentMethod', 'link')}
        >
          🔗 {t('staff.orderForm.paymentLink')}
        </button>
      </div>
    </div>
  );
};

/**
 * SubmitSection - Price display and submit button.
 */
export const SubmitSection = ({ totalPrice, isSaving }) => {
  const { t } = useTranslation();

  return (
    <div className="submit-section">
      <div className="price-display">
        <span className="price-label">{t('staff.orderForm.totalPrice')}</span>
        <span className="price-amount">AED {totalPrice}</span>
      </div>
      <button
        type="submit"
        className="submit-btn-large"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <span className="btn-spinner"></span>
            {t('staff.orderForm.submitting')}
          </>
        ) : (
          <>
            <span>✓</span>
            {t('staff.orderForm.submit')}
          </>
        )}
      </button>
    </div>
  );
};

/**
 * NotesField - Notes textarea rendered inside "More Details" accordion.
 */
export const NotesField = ({ notes, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="detail-field">
      <label>{t('staff.orderForm.notes')}</label>
      <textarea
        value={notes}
        onChange={(e) => onChange('notes', e.target.value)}
        placeholder={t('staff.orderForm.notesPlaceholder')}
        rows={2}
      />
    </div>
  );
};

/**
 * ConfirmationModal - Order confirmation overlay shown after successful submission.
 */
export const ConfirmationModal = ({ confirmedOrder, onClose }) => {
  const { t } = useTranslation();

  if (!confirmedOrder) return null;

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal">
        <div className="confirmation-icon">✅</div>
        <h3>{t('staff.orderForm.orderConfirmed')}</h3>
        <p className="confirmation-message">{t('staff.orderForm.orderInSystem')}</p>

        <div className="order-details">
          <div className="detail-row">
            <span className="detail-label">Order ID:</span>
            <span className="detail-value">{confirmedOrder.orderId.slice(-8)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{t('staff.orderForm.area')}:</span>
            <span className="detail-value">{confirmedOrder.area}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">{t('staff.orderForm.paymentMethod')}:</span>
            <span className="detail-value">
              {confirmedOrder.paymentMethod === 'cash' ? `💵 ${t('staff.orderForm.cash')}` : `🔗 ${t('staff.orderForm.paymentLink')}`}
            </span>
          </div>
          <div className="detail-row total">
            <span className="detail-label">{t('staff.orderForm.totalPrice')}:</span>
            <span className="detail-value">AED {confirmedOrder.totalPrice}</span>
          </div>
        </div>

        <button
          className="new-order-btn"
          onClick={onClose}
        >
          {t('staff.orderForm.newOrder')}
        </button>
      </div>
    </div>
  );
};

export default SubmitSection;
