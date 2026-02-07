import React from 'react';
import { useTranslation } from 'react-i18next';
import { PACKAGES, VEHICLE_TYPES, VEHICLE_SIZES } from '../../config/packages';
import ImageUpload from '../ImageUpload';

/**
 * VehicleSection - Vehicle type selection, size selector, package selector,
 * image upload, vehicles-in-area counter, and multi-vehicle management.
 */
const VehicleSection = ({
  currentVehicle,
  vehicles,
  needsSize,
  imageError,
  isSaving,
  vehiclesInArea,
  showMoreDetails,
  onVehicleChange,
  onImageSelect,
  onVehiclesInAreaChange,
  onAddVehicle,
  onRemoveVehicle,
  getVehiclePrice,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Vehicle Type Selection - Large Buttons */}
      <div className="quick-section">
        <div className="vehicle-selector-compact">
          {VEHICLE_TYPES.map((vType) => (
            <button
              key={vType.id}
              type="button"
              className={`vehicle-btn ${currentVehicle.vehicleType === vType.id ? 'selected' : ''}`}
              onClick={() => onVehicleChange(0, 'vehicleType', vType.id)}
            >
              <span className="vehicle-icon-large">{vType.icon}</span>
              <span className="vehicle-label">{t(`wizard.${vType.id}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Size selector for caravan/boat */}
      {needsSize && (
        <div className="quick-section">
          <div className="size-selector-compact">
            {VEHICLE_SIZES[currentVehicle.vehicleType]?.map((size) => (
              <button
                key={size.id}
                type="button"
                className={`size-btn ${currentVehicle.vehicleSize === size.id ? 'selected' : ''}`}
                onClick={() => onVehicleChange(0, 'vehicleSize', size.id)}
              >
                <span>{size.icon}</span>
                <span>{t(`wizard.${currentVehicle.vehicleType}${size.id.charAt(0).toUpperCase() + size.id.slice(1)}`)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Package Selection - Show Prices */}
      <div className="quick-section">
        <div className="package-selector-compact">
          {Object.values(PACKAGES).filter(p => p.available).map((pkg) => {
            let priceKey = currentVehicle.vehicleType;
            if (needsSize && currentVehicle.vehicleSize) {
              priceKey = `${currentVehicle.vehicleType}_${currentVehicle.vehicleSize}`;
            }
            const price = pkg.prices[priceKey] || 0;

            return (
              <button
                key={pkg.id}
                type="button"
                className={`package-btn ${currentVehicle.package === pkg.id ? 'selected' : ''}`}
                onClick={() => onVehicleChange(0, 'package', pkg.id)}
              >
                <span className="pkg-icon">{pkg.icon}</span>
                <span className="pkg-name">{t(`packages.${pkg.id}.name`)}</span>
                <span className="pkg-price">AED {price}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

/**
 * VehicleImageUpload - The image upload portion that appears in the quick-access-row.
 */
export const VehicleImageUpload = ({ onImageSelect, imageError, isSaving }) => {
  return (
    <div className="quick-photo">
      <ImageUpload
        onImageSelect={onImageSelect}
        error={imageError}
        disabled={isSaving}
        compact={true}
      />
    </div>
  );
};

/**
 * VehicleDetailsSection - Vehicles-in-area counter and multi-vehicle summary.
 * Rendered inside the "More Details" accordion.
 */
export const VehicleDetailsSection = ({
  vehicles,
  vehiclesInArea,
  onVehiclesInAreaChange,
  onAddVehicle,
  onRemoveVehicle,
  getVehiclePrice,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Vehicles in Area */}
      <div className="detail-field">
        <label>{t('staff.orderForm.vehiclesInArea')}</label>
        <div className="counter-mini">
          <button
            type="button"
            onClick={() => onVehiclesInAreaChange(Math.max(1, vehiclesInArea - 1))}
            disabled={vehiclesInArea <= 1}
          >
            {'\u2212'}
          </button>
          <span>{vehiclesInArea}</span>
          <button
            type="button"
            onClick={() => onVehiclesInAreaChange(Math.min(20, vehiclesInArea + 1))}
            disabled={vehiclesInArea >= 20}
          >
            +
          </button>
        </div>
      </div>

      {/* Add Multiple Vehicles */}
      {vehicles.length > 1 && (
        <div className="multi-vehicle-summary">
          <h4>{t('staff.orderForm.vehicles')} ({vehicles.length})</h4>
          {vehicles.map((v, i) => (
            <div key={i} className="vehicle-row">
              <span>{t(`wizard.${v.vehicleType}`)} - {t(`packages.${v.package}.name`)}</span>
              <span>AED {getVehiclePrice(v)}</span>
              {i > 0 && (
                <button type="button" onClick={() => onRemoveVehicle(i)}>{'\u2715'}</button>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="add-vehicle-btn-mini"
        onClick={onAddVehicle}
      >
        {'\u2795'} {t('staff.orderForm.addVehicle')}
      </button>
    </>
  );
};

export default VehicleSection;
