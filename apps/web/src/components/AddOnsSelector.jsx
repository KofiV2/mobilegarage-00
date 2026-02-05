import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './AddOnsSelector.css';

/**
 * AddOnsSelector Component
 *
 * Shows available add-ons for Platinum package.
 * Allows customers to select add-ons and customize tip amount.
 */
const AddOnsSelector = ({
  addOns,
  selectedAddOns,
  onAddOnChange,
  packageId
}) => {
  const { t } = useTranslation();
  const [expandedDetails, setExpandedDetails] = useState({});
  const [customTip, setCustomTip] = useState('');

  // Only show add-ons for Platinum package
  if (packageId !== 'platinum') {
    return null;
  }

  const toggleDetails = (addonId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [addonId]: !prev[addonId]
    }));
  };

  const handleAddOnToggle = (addonId) => {
    const addon = addOns.find(a => a.id === addonId);
    if (!addon) return;

    if (addonId === 'tip') {
      // For tip, toggle between 0 and default preset
      const currentValue = selectedAddOns[addonId];
      if (currentValue) {
        onAddOnChange(addonId, 0);
      } else {
        onAddOnChange(addonId, addon.presetAmounts?.[1] || addon.price);
      }
    } else {
      // For other add-ons, toggle boolean
      onAddOnChange(addonId, !selectedAddOns[addonId]);
    }
  };

  const handleTipPresetSelect = (amount) => {
    setCustomTip('');
    onAddOnChange('tip', amount);
  };

  const handleCustomTipChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCustomTip(value);
    if (value) {
      onAddOnChange('tip', parseInt(value, 10));
    }
  };

  return (
    <div className="addons-selector">
      <h4 className="addons-title">
        <span className="addons-icon">🎁</span>
        {t('addons.title')}
      </h4>
      <p className="addons-subtitle">{t('addons.subtitle')}</p>

      <div className="addons-list">
        {addOns.map((addon) => {
          const isSelected = addon.id === 'tip'
            ? selectedAddOns[addon.id] > 0
            : selectedAddOns[addon.id];
          const isExpanded = expandedDetails[addon.id];

          return (
            <div
              key={addon.id}
              className={`addon-item ${isSelected ? 'selected' : ''}`}
            >
              <div className="addon-main" onClick={() => handleAddOnToggle(addon.id)}>
                <div className="addon-checkbox">
                  {isSelected ? '✓' : ''}
                </div>
                <span className="addon-icon">{addon.icon}</span>
                <div className="addon-info">
                  <span className="addon-name">{t(`addons.${addon.id}.name`)}</span>
                  <span className="addon-price">
                    {addon.id === 'tip' && selectedAddOns[addon.id] > 0
                      ? `AED ${selectedAddOns[addon.id]}`
                      : `AED ${addon.price}`
                    }
                  </span>
                </div>
                <button
                  className="addon-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDetails(addon.id);
                  }}
                  aria-expanded={isExpanded}
                  aria-label={t('addons.showDetails')}
                >
                  {isExpanded ? '▲' : '▼'}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="addon-details">
                  <p className="addon-description">
                    {t(`addons.${addon.id}.description`)}
                  </p>
                </div>
              )}

              {/* Tip Amount Selection */}
              {addon.id === 'tip' && isSelected && (
                <div className="tip-selector">
                  <div className="tip-presets">
                    {addon.presetAmounts?.map((amount) => (
                      <button
                        key={amount}
                        className={`tip-preset-btn ${selectedAddOns.tip === amount && !customTip ? 'active' : ''}`}
                        onClick={() => handleTipPresetSelect(amount)}
                      >
                        AED {amount}
                      </button>
                    ))}
                  </div>
                  {addon.hasCustomAmount && (
                    <div className="tip-custom">
                      <span className="tip-custom-label">{t('addons.customAmount')}</span>
                      <div className="tip-custom-input">
                        <span className="currency">AED</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={customTip}
                          onChange={handleCustomTipChange}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

AddOnsSelector.propTypes = {
  addOns: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    enabled: PropTypes.bool,
    hasCustomAmount: PropTypes.bool,
    presetAmounts: PropTypes.arrayOf(PropTypes.number)
  })).isRequired,
  selectedAddOns: PropTypes.object.isRequired,
  onAddOnChange: PropTypes.func.isRequired,
  packageId: PropTypes.string.isRequired
};

export default AddOnsSelector;
