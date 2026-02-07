import React, { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const ConfirmationStep = memo(function ConfirmationStep({
  booking,
  isGuest,
  phoneTouched,
  submitAttempted,
  onPhoneChange,
  onPhoneBlur,
  formatDate,
  getTimeLabel,
  getPaymentLabel,
  getPrice,
  getAddOnsPrice,
  getTotalPrice,
  getMonthlyTotal,
  selectedAddOns,
  addOns,
  useFreeWash = false,
  getOriginalPrice,
  // Promo code props
  promoCode = '',
  onPromoCodeChange,
  onApplyPromoCode,
  appliedPromo,
  promoError,
  isValidatingPromo,
  promoDiscount = 0,
}) {
  const { t } = useTranslation();
  const [showPromoInput, setShowPromoInput] = useState(false);

  const handleApplyPromo = useCallback(() => {
    if (onApplyPromoCode && promoCode.trim()) {
      onApplyPromoCode(promoCode.trim(), booking.package);
    }
  }, [onApplyPromoCode, promoCode, booking.package]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyPromo();
    }
  }, [handleApplyPromo]);

  return (
    <div className="wizard-step fade-in">
      <h3 className="step-title">{t('wizard.step6')}</h3>

      {/* Guest Phone Collection */}
      {isGuest && (
        <div className="guest-phone-section">
          <label className="input-label">{t('guest.phoneLabel')}</label>
          <p className="phone-help-text">{t('guest.phoneHelp')}</p>
          <div className={`phone-input-group ${(phoneTouched && booking.guestPhone.length > 0 && !booking.guestPhone.startsWith('5')) || (submitAttempted && (booking.guestPhone.length === 0 || booking.guestPhone.length < 9)) ? 'has-error shake' : ''} ${booking.guestPhone.length === 9 && booking.guestPhone.startsWith('5') ? 'has-success' : ''}`}>
            <div className="phone-prefix">
              <span className="uae-flag">🇦🇪</span>
              <span className="prefix-code">+971</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`phone-input ${(phoneTouched && booking.guestPhone.length > 0 && !booking.guestPhone.startsWith('5')) || (submitAttempted && booking.guestPhone.length === 0) ? 'error' : ''}`}
              value={booking.guestPhone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                onPhoneChange(digits);
              }}
              onBlur={onPhoneBlur}
              placeholder="5X XXX XXXX"
              aria-describedby="phone-error"
            />
            {booking.guestPhone.length === 9 && booking.guestPhone.startsWith('5') && (
              <span className="phone-success-icon" aria-hidden="true">✓</span>
            )}
          </div>
          {(phoneTouched || submitAttempted) && booking.guestPhone.length === 0 && (
            <p id="phone-error" className="phone-error-text" role="alert">
              {t('guest.phoneRequired')}
            </p>
          )}
          {phoneTouched && booking.guestPhone.length > 0 && !booking.guestPhone.startsWith('5') && (
            <p id="phone-error" className="phone-error-text" role="alert">
              {t('guest.phoneStartsWith5')}
            </p>
          )}
          {(phoneTouched || submitAttempted) && booking.guestPhone.length > 0 && booking.guestPhone.length < 9 && booking.guestPhone.startsWith('5') && (
            <p id="phone-error" className="phone-error-text" role="alert">
              {t('guest.phoneRequired')}
            </p>
          )}
        </div>
      )}

      {/* Promo Code Section */}
      {!useFreeWash && onPromoCodeChange && (
        <div className="promo-code-section">
          {!showPromoInput && !appliedPromo ? (
            <button
              type="button"
              className="promo-toggle-btn"
              onClick={() => setShowPromoInput(true)}
            >
              🎟️ {t('promo.haveCode') || 'Have a promo code?'}
            </button>
          ) : appliedPromo ? (
            <div className="promo-applied">
              <div className="promo-success">
                <span className="promo-icon">✅</span>
                <span className="promo-text">
                  <strong>{appliedPromo.code}</strong> - {' '}
                  {appliedPromo.discountType === 'percentage'
                    ? `${appliedPromo.discountValue}% ${t('promo.off') || 'off'}`
                    : `AED ${appliedPromo.discountValue} ${t('promo.off') || 'off'}`
                  }
                </span>
              </div>
            </div>
          ) : (
            <div className="promo-input-wrapper">
              <div className="promo-input-group">
                <input
                  type="text"
                  className={`promo-input ${promoError ? 'has-error' : ''}`}
                  placeholder={t('promo.enterCode') || 'Enter promo code'}
                  value={promoCode}
                  onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  disabled={isValidatingPromo}
                  autoCapitalize="characters"
                />
                <button
                  type="button"
                  className="promo-apply-btn"
                  onClick={handleApplyPromo}
                  disabled={isValidatingPromo || !promoCode.trim()}
                >
                  {isValidatingPromo ? '...' : t('promo.apply') || 'Apply'}
                </button>
              </div>
              {promoError && (
                <p className="promo-error" role="alert">{promoError}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="summary-section">
        <h4 className="summary-title">{t('wizard.summary')}</h4>
        <div className="summary-items">
          <div className="summary-item">
            <span className="summary-label">{t('wizard.step1')}:</span>
            <span className="summary-value">
              {t(`wizard.${booking.vehicleType}`)}
              {booking.vehicleSize && ` (${t(`wizard.${booking.vehicleType}${booking.vehicleSize.charAt(0).toUpperCase() + booking.vehicleSize.slice(1)}`)})`}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('wizard.step2')}:</span>
            <span className="summary-value">{t(`packages.${booking.package}.name`)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('wizard.selectDate')}:</span>
            <span className="summary-value">{formatDate(booking.date)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('wizard.selectTime')}:</span>
            <span className="summary-value">{getTimeLabel()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('wizard.areaNeighborhood')}:</span>
            <span className="summary-value">{booking.area}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('wizard.villaHouse')}:</span>
            <span className="summary-value">{booking.villa}</span>
          </div>
          {booking.street && (
            <div className="summary-item">
              <span className="summary-label">{t('wizard.streetName')}:</span>
              <span className="summary-value">{booking.street}</span>
            </div>
          )}
          {booking.instructions && (
            <div className="summary-item">
              <span className="summary-label">{t('wizard.specialInstructions')}:</span>
              <span className="summary-value">{booking.instructions}</span>
            </div>
          )}
          <div className="summary-item">
            <span className="summary-label">{t('wizard.paymentMethod')}:</span>
            <span className="summary-value">{getPaymentLabel()}</span>
          </div>
          {booking.latitude && booking.longitude && (
            <div className="summary-item">
              <span className="summary-label">{t('wizard.mapLocation')}:</span>
              <span className="summary-value">📍 {t('wizard.locationShared')}</span>
            </div>
          )}
          {booking.isMonthlySubscription && (
            <div className="summary-item subscription-info">
              <span className="summary-label">{t('wizard.subscriptionType')}:</span>
              <span className="summary-value subscription-value">
                🔄 {t('wizard.monthlySubscription')} (-7.5%)
              </span>
            </div>
          )}
          {useFreeWash && (
            <div className="summary-item free-wash-info">
              <span className="summary-label">{t('wizard.loyaltyReward')}:</span>
              <span className="summary-value free-wash-value">
                🎁 {t('wizard.freeWashApplied')}
              </span>
            </div>
          )}
          <div className="summary-item">
            <span className="summary-label">
              {booking.isMonthlySubscription ? t('wizard.pricePerWash') : t('wizard.packagePrice')}:
            </span>
            <span className="summary-value price">
              {useFreeWash ? (
                <>
                  <span className="original-price-strikethrough">AED {getOriginalPrice()}</span>
                  <span className="free-price">FREE</span>
                </>
              ) : (
                `AED ${getPrice()}`
              )}
            </span>
          </div>
          {/* Add-ons Summary */}
          {booking.package === 'platinum' && getAddOnsPrice() > 0 && (
            <>
              <div className="summary-item addons-summary">
                <span className="summary-label">{t('addons.title')}:</span>
                <span className="summary-value">
                  {Object.entries(selectedAddOns)
                    .filter(([_, value]) => value && value !== 0)
                    .map(([id, value]) => {
                      const addon = addOns.find(a => a.id === id);
                      if (!addon) return null;
                      const displayPrice = id === 'tip' ? value : addon.price;
                      return `${addon.icon} AED ${displayPrice}`;
                    })
                    .filter(Boolean)
                    .join(', ')
                  }
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('addons.subtotal')}:</span>
                <span className="summary-value">AED {getAddOnsPrice()}</span>
              </div>
            </>
          )}
          {/* Promo Discount */}
          {appliedPromo && promoDiscount > 0 && (
            <div className="summary-item promo-discount-row">
              <span className="summary-label">
                🎟️ {t('promo.discount') || 'Promo discount'}:
              </span>
              <span className="summary-value discount">-AED {promoDiscount}</span>
            </div>
          )}
          {/* Total */}
          <div className="summary-item total">
            <span className="summary-label">{t('wizard.total')}:</span>
            <span className="summary-value price">
              {useFreeWash && getAddOnsPrice() === 0 ? (
                <span className="free-total">🎉 FREE</span>
              ) : (
                `AED ${getTotalPrice()}`
              )}
            </span>
          </div>
          {useFreeWash && (
            <div className="summary-item savings-row">
              <span className="summary-label">{t('wizard.youSaved')}:</span>
              <span className="summary-value savings">AED {getOriginalPrice()}</span>
            </div>
          )}
          {appliedPromo && promoDiscount > 0 && !useFreeWash && (
            <div className="summary-item savings-row">
              <span className="summary-label">{t('wizard.youSaved') || 'You saved'}:</span>
              <span className="summary-value savings">AED {promoDiscount}</span>
            </div>
          )}
          {booking.isMonthlySubscription && (
            <div className="summary-item monthly-total-row">
              <span className="summary-label">{t('wizard.monthlyTotal')} (4 {t('wizard.washes')}):</span>
              <span className="summary-value price monthly">AED {getMonthlyTotal()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ConfirmationStep;
