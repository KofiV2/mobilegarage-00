/**
 * SubscriptionPlans Component
 * 
 * Beautiful pricing cards for subscription plans.
 * Shows after first booking to maximize conversion.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription, SUBSCRIPTION_PLANS } from '../hooks/useSubscription';
import { useToast } from './Toast';
import './SubscriptionPlans.css';

export function SubscriptionPlans({ 
  onSubscribe, 
  onClose,
  lastBookingPrice = 89,
  showAsBottomSheet = false 
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { subscribe, loading, subscription, isActive } = useSubscription();
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (planId) => {
    setSubscribing(true);
    const result = await subscribe(planId);
    
    if (result.success) {
      showToast(t('subscription.success') || 'Subscribed successfully! 🎉', 'success');
      onSubscribe?.(planId);
      onClose?.();
    } else {
      showToast(result.error, 'error');
    }
    setSubscribing(false);
  };

  // Calculate per-wash price for comparison
  const perWashPrice = (plan) => {
    return Math.round(plan.price / plan.washesPerMonth);
  };

  const plans = Object.values(SUBSCRIPTION_PLANS);

  if (isActive()) {
    return (
      <div className="subscription-active">
        <div className="active-badge">✓ {t('subscription.active') || 'Subscribed'}</div>
        <p>{subscription.plan?.name}</p>
      </div>
    );
  }

  return (
    <div className={`subscription-plans ${isRTL ? 'rtl' : ''} ${showAsBottomSheet ? 'bottom-sheet' : ''}`}>
      {showAsBottomSheet && (
        <div className="bottom-sheet-header">
          <div className="sheet-handle" />
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      )}

      <div className="plans-header">
        <h2>💎 {t('subscription.title') || 'Subscribe & Save'}</h2>
        <p className="subtitle">
          {t('subscription.subtitle') || `You just paid ${lastBookingPrice} AED. Save up to 40% with a subscription!`}
        </p>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => {
          const isPopular = plan.badge === 'MOST POPULAR';
          const isBestValue = plan.badge === 'BEST VALUE';
          const name = isRTL ? plan.nameAr : plan.name;
          const description = isRTL ? plan.descriptionAr : plan.description;
          const features = isRTL ? plan.featuresAr : plan.features;
          const badge = isRTL ? plan.badgeAr : plan.badge;

          return (
            <div 
              key={plan.id}
              className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${isPopular ? 'popular' : ''} ${isBestValue ? 'best-value' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {badge && (
                <div className={`plan-badge ${isPopular ? 'popular-badge' : 'value-badge'}`}>
                  {badge}
                </div>
              )}

              <div className="plan-header">
                <h3 className="plan-name">{name}</h3>
                <p className="plan-description">{description}</p>
              </div>

              <div className="plan-pricing">
                <div className="price">
                  <span className="amount">{plan.price}</span>
                  <span className="currency">{plan.currency}</span>
                  <span className="period">/{t('common.month') || 'month'}</span>
                </div>
                <div className="per-wash">
                  <span className="per-wash-price">{perWashPrice(plan)} {plan.currency}</span>
                  <span className="per-wash-label">/{t('common.perWash') || 'wash'}</span>
                </div>
                <div className="savings-badge">
                  🎁 {t('subscription.save') || 'Save'} {plan.savings}%
                </div>
              </div>

              <ul className="plan-features">
                {features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="feature-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`subscribe-btn ${selectedPlan === plan.id ? 'primary' : 'secondary'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubscribe(plan.id);
                }}
                disabled={subscribing}
              >
                {subscribing && selectedPlan === plan.id ? (
                  <span className="loading-spinner" />
                ) : (
                  t('subscription.subscribe') || 'Subscribe Now'
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="plans-footer">
        <p className="guarantee">
          ✅ {t('subscription.guarantee') || 'Cancel anytime • No commitment'}
        </p>
        <p className="secure">
          🔒 {t('subscription.secure') || 'Secure payment via card or Apple Pay'}
        </p>
      </div>
    </div>
  );
}

export default SubscriptionPlans;
