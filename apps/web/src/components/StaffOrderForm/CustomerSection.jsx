import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * CustomerPhoneInput - Phone input that appears in the quick-access-row.
 */
export const CustomerPhoneInput = ({ customerPhone, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="quick-phone">
      <span className="quick-icon">📱</span>
      <div className="phone-input-mini">
        <span className="prefix">+971</span>
        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => onChange('customerPhone', e.target.value.replace(/\D/g, '').slice(0, 9))}
          placeholder="50 123 4567"
          maxLength={9}
        />
      </div>
    </div>
  );
};

/**
 * CustomerDetailsSection - Customer name field rendered inside "More Details" accordion.
 */
export const CustomerDetailsSection = ({ customerName, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="detail-field">
      <label>{t('staff.orderForm.name')}</label>
      <input
        type="text"
        value={customerName}
        onChange={(e) => onChange('customerName', e.target.value)}
        placeholder={t('staff.orderForm.namePlaceholder')}
      />
    </div>
  );
};

export default CustomerPhoneInput;
