import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

const PAYMENT_METHODS = [
  { id: 'cash', icon: '💵' },
  { id: 'card', icon: '💳' }
];

const PaymentStep = memo(function PaymentStep({
  booking,
  onPaymentSelect,
}) {
  const { t } = useTranslation();

  return (
    <div className="wizard-step fade-in">
      <h3 className="step-title">{t('wizard.step5')}</h3>
      <div className="payment-options">
        {PAYMENT_METHODS.map(({ id, icon }) => (
          <button
            key={id}
            className={`payment-option ${booking.paymentMethod === id ? 'selected' : ''}`}
            onClick={() => onPaymentSelect(id)}
          >
            <span className="payment-icon">{icon}</span>
            <div className="payment-content">
              <span className="payment-name">{t(`wizard.${id}`)}</span>
              <span className="payment-desc">{t(`wizard.${id}Desc`)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

export default PaymentStep;
