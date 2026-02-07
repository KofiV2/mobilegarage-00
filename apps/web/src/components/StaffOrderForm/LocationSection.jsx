import React from 'react';
import { useTranslation } from 'react-i18next';
import { EMIRATES } from '../../config/emirates';

/**
 * LocationAreaInput - The main area input field (required).
 * Rendered in the quick-entry section of the form.
 */
export const LocationAreaInput = ({ area, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="quick-section">
      <div className="area-input-wrapper">
        <span className="area-icon">📍</span>
        <input
          type="text"
          value={area}
          onChange={(e) => onChange('area', e.target.value)}
          placeholder={t('staff.orderForm.areaPlaceholder')}
          className="area-input"
          required
        />
      </div>
    </div>
  );
};

/**
 * LocationDetailsSection - Emirate, street, and villa fields.
 * Rendered inside the "More Details" accordion.
 */
export const LocationDetailsSection = ({ emirate, street, villa, onChange }) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Emirate */}
      <div className="detail-field">
        <label>{t('staff.orderForm.emirate')}</label>
        <select
          value={emirate}
          onChange={(e) => onChange('emirate', e.target.value)}
        >
          <option value="">{t('staff.orderForm.selectEmirate')}</option>
          {EMIRATES.map((em) => (
            <option key={em.id} value={em.id}>
              {em.name}
            </option>
          ))}
        </select>
      </div>

      {/* Street */}
      <div className="detail-field">
        <label>{t('staff.orderForm.street')}</label>
        <input
          type="text"
          value={street}
          onChange={(e) => onChange('street', e.target.value)}
          placeholder={t('staff.orderForm.streetPlaceholder')}
        />
      </div>

      {/* Villa */}
      <div className="detail-field">
        <label>{t('staff.orderForm.villa')}</label>
        <input
          type="text"
          value={villa}
          onChange={(e) => onChange('villa', e.target.value)}
          placeholder={t('staff.orderForm.villaPlaceholder')}
        />
      </div>
    </>
  );
};

export default LocationAreaInput;
