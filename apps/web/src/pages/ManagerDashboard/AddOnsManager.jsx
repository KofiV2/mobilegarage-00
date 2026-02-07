import React from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_ADDONS } from '../../config/packages';

const AddOnsManager = ({
  show,
  onClose,
  addOnsConfig,
  savingAddOns,
  updateAddOnPrice,
  toggleAddOnEnabled,
  saveAddOnsConfig
}) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="addons-manager-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>{'\u2715'}</button>

        <h3>{'\uD83C\uDF81'} {t('manager.addOns.title') || 'Add-ons Pricing'}</h3>
        <p className="addons-manager-subtitle">
          {t('manager.addOns.subtitle') || 'Configure prices for Platinum package add-ons'}
        </p>

        <div className="addons-list-manager">
          {DEFAULT_ADDONS.map(addon => {
            const config = addOnsConfig[addon.id] || { price: addon.defaultPrice, enabled: true };

            return (
              <div key={addon.id} className={`addon-config-item ${config.enabled ? '' : 'disabled'}`}>
                <div className="addon-config-header">
                  <span className="addon-config-icon">{addon.icon}</span>
                  <div className="addon-config-info">
                    <span className="addon-config-name">{t(`addons.${addon.id}.name`)}</span>
                    <span className="addon-config-desc">{t(`addons.${addon.id}.description`)?.slice(0, 60)}...</span>
                  </div>
                  <label className="addon-toggle">
                    <input
                      type="checkbox"
                      checked={config.enabled !== false}
                      onChange={() => toggleAddOnEnabled(addon.id)}
                      disabled={savingAddOns}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="addon-config-price">
                  <label>
                    <span>{t('manager.addOns.price') || 'Price'} (AED)</span>
                    <div className="price-input-wrapper">
                      <span className="currency-symbol">AED</span>
                      <input
                        type="number"
                        value={config.price || 0}
                        onChange={(e) => updateAddOnPrice(addon.id, e.target.value)}
                        min="0"
                        disabled={!config.enabled || savingAddOns}
                      />
                    </div>
                  </label>
                  {addon.hasCustomAmount && (
                    <span className="custom-amount-note">
                      {t('manager.addOns.customAmountNote') || 'Customers can enter custom amount'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="addons-manager-actions">
          <button
            className="cancel-btn"
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button
            className="save-btn"
            onClick={() => saveAddOnsConfig(addOnsConfig)}
            disabled={savingAddOns}
          >
            {savingAddOns ? '...' : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOnsManager;
