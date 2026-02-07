import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

const LocationStep = memo(function LocationStep({
  booking,
  isLocating,
  locationError,
  onGetLocation,
  onManualLocation,
  onChangeMethod,
  onFieldChange,
}) {
  const { t } = useTranslation();

  return (
    <div className="wizard-step fade-in">
      <h3 className="step-title">{t('wizard.step4')}</h3>

      {/* Location Mode Selection */}
      {!booking.locationMode && (
        <div className="location-mode-options">
          <button
            className={`location-mode-btn ${isLocating ? 'loading' : ''}`}
            onClick={onGetLocation}
            disabled={isLocating}
          >
            <span className="mode-icon">📍</span>
            <div className="mode-content">
              <span className="mode-title">
                {isLocating ? t('wizard.detecting') : t('wizard.useMyLocation')}
              </span>
              <span className="mode-subtitle">{t('wizard.recommended')}</span>
            </div>
          </button>
          <button
            className="location-mode-btn"
            onClick={onManualLocation}
          >
            <span className="mode-icon">✏️</span>
            <div className="mode-content">
              <span className="mode-title">{t('wizard.enterManually')}</span>
            </div>
          </button>
          {locationError && (
            <p className="location-error">{locationError}</p>
          )}
        </div>
      )}

      {/* Location Form (shown after mode selection) */}
      {booking.locationMode && (
        <div className="location-fields">
          {/* Back to mode selection */}
          <button
            className="change-mode-btn"
            onClick={onChangeMethod}
          >
            <span className="back-arrow">←</span> {t('wizard.changeMethod')}
          </button>

          {/* Auto-detected area display */}
          {booking.locationMode === 'auto' && booking.area && (
            <div className="detected-area">
              <span className="detected-icon">📍</span>
              <div className="detected-content">
                <span className="detected-label">{t('wizard.detectedArea')}</span>
                <span className="detected-value">{booking.area}</span>
              </div>
            </div>
          )}

          {/* Manual area input */}
          {booking.locationMode === 'manual' && (
            <div className="location-field">
              <label>
                {t('wizard.areaNeighborhood')} <span className="required">*</span>
              </label>
              <input
                type="text"
                value={booking.area}
                onChange={(e) => onFieldChange('area', e.target.value)}
                placeholder={t('wizard.areaPlaceholder')}
              />
            </div>
          )}

          {/* Villa/House Number */}
          <div className="location-field">
            <label>
              {t('wizard.villaHouse')} <span className="required">*</span>
            </label>
            <input
              type="text"
              value={booking.villa}
              onChange={(e) => onFieldChange('villa', e.target.value)}
              placeholder={t('wizard.villaPlaceholder')}
            />
          </div>

          {/* Street Name */}
          <div className="location-field">
            <label>{t('wizard.streetName')}</label>
            <input
              type="text"
              value={booking.street}
              onChange={(e) => onFieldChange('street', e.target.value)}
              placeholder={t('wizard.streetPlaceholder')}
            />
          </div>

          {/* Special Instructions */}
          <div className="location-field">
            <label>{t('wizard.specialInstructions')}</label>
            <textarea
              value={booking.instructions}
              onChange={(e) => onFieldChange('instructions', e.target.value)}
              placeholder={t('wizard.instructionsPlaceholder')}
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default LocationStep;
