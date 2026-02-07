import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { PACKAGES } from '../../config/packages';
import AddOnsSelector from '../AddOnsSelector';

const PackageStep = memo(function PackageStep({
  booking,
  onPackageSelect,
  onToggleSubscription,
  getBasePrice,
  getPrice,
  getMonthlyTotal,
  enabledAddOns,
  selectedAddOns,
  onAddOnChange,
}) {
  const { t } = useTranslation();

  return (
    <div className="wizard-step fade-in">
      <h3 className="step-title">{t('wizard.step2')}</h3>

      {/* Monthly Subscription Toggle */}
      <div className="subscription-toggle-section">
        <div
          className={`subscription-toggle ${booking.isMonthlySubscription ? 'active' : ''}`}
          onClick={onToggleSubscription}
        >
          <div className="toggle-content">
            <div className="toggle-header">
              <span className="toggle-icon">🔄</span>
              <span className="toggle-title">{t('wizard.monthlySubscription')}</span>
              <span className="discount-badge">-7.5%</span>
            </div>
            <p className="toggle-description">{t('wizard.monthlySubscriptionDesc')}</p>
          </div>
          <div className="toggle-switch">
            <div className="toggle-track">
              <div className="toggle-thumb"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="package-options">
        {Object.entries(PACKAGES).map(([key, pkg]) => {
          const basePrice = pkg.prices[booking.vehicleType] || 0;
          const displayPrice = booking.isMonthlySubscription
            ? Math.round(basePrice * (1 - 0.075))
            : basePrice;

          return (
            <button
              key={key}
              className={`package-option ${booking.package === key ? 'selected' : ''} ${!pkg.available ? 'disabled' : ''}`}
              onClick={() => onPackageSelect(key)}
              disabled={!pkg.available}
            >
              <span className="package-icon">{pkg.icon}</span>
              <span className="package-name">{t(`packages.${key}.name`)}</span>
              {pkg.available ? (
                <div className="package-price-container">
                  {booking.isMonthlySubscription && (
                    <span className="package-price-original">AED {basePrice}</span>
                  )}
                  <span className="package-price">
                    AED {displayPrice}
                  </span>
                  {booking.isMonthlySubscription && (
                    <span className="package-price-per">{t('wizard.perWash')}</span>
                  )}
                </div>
              ) : (
                <span className="package-coming-soon">{t('packages.comingSoon')}</span>
              )}
            </button>
          );
        })}
      </div>

      {booking.isMonthlySubscription && booking.package && (
        <div className="monthly-summary">
          <div className="monthly-summary-row">
            <span>{t('wizard.monthlyTotal')} (4 {t('wizard.washes')}):</span>
            <span className="monthly-total">AED {getMonthlyTotal()}</span>
          </div>
          <div className="monthly-savings">
            {t('wizard.youSave')} AED {(getBasePrice() * 4) - getMonthlyTotal()} {t('wizard.perMonth')}
          </div>
        </div>
      )}

      {/* Add-ons Selector - Only for Platinum */}
      {booking.package === 'platinum' && (
        <AddOnsSelector
          addOns={enabledAddOns}
          selectedAddOns={selectedAddOns}
          onAddOnChange={onAddOnChange}
          packageId={booking.package}
        />
      )}
    </div>
  );
});

export default PackageStep;
