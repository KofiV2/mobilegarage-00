import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { VEHICLE_TYPES, VEHICLE_SIZES } from '../../config/packages';
import SavedVehicleSelector from '../SavedVehicleSelector';

const VehicleStep = memo(function VehicleStep({
  booking,
  isGuest,
  vehicles,
  selectedSavedVehicle,
  showManualSelection,
  onSavedVehicleSelect,
  onSkipSavedVehicles,
  onVehicleSelect,
  onSizeSelect,
  onBackToSaved,
}) {
  const { t } = useTranslation();

  return (
    <div className="wizard-step fade-in">
      <h3 className="step-title">{t('wizard.step1')}</h3>

      {/* Saved Vehicles Selector (for authenticated users with saved vehicles) */}
      {!isGuest && vehicles.length > 0 && !showManualSelection && (
        <SavedVehicleSelector
          vehicles={vehicles}
          selectedVehicleId={selectedSavedVehicle?.id}
          onSelect={onSavedVehicleSelect}
          onSkip={onSkipSavedVehicles}
          showSkipOption={true}
        />
      )}

      {/* Manual Vehicle Selection (shown if no saved vehicles, guest mode, or user skipped) */}
      {(isGuest || vehicles.length === 0 || showManualSelection) && (
        <>
          {vehicles.length > 0 && showManualSelection && (
            <button
              className="back-to-saved-btn"
              onClick={onBackToSaved}
            >
              <span className="back-arrow">←</span> {t('vehicles.useSaved')}
            </button>
          )}
          <div className="vehicle-options">
            {VEHICLE_TYPES.map(({ id, icon }) => (
              <button
                key={id}
                className={`vehicle-card ${booking.vehicleType === id && !selectedSavedVehicle ? 'selected' : ''}`}
                onClick={() => onVehicleSelect(id)}
              >
                <span className="vehicle-icon">{icon}</span>
                <span className="vehicle-name">{t(`wizard.${id}`)}</span>
                <span className="vehicle-desc">{t(`wizard.${id}Desc`)}</span>
              </button>
            ))}

            {/* Size selection for Boat/Caravan */}
            {booking.vehicleType && VEHICLE_TYPES.find(v => v.id === booking.vehicleType)?.hasSizes && (
              <div className="vehicle-size-section">
                <h4 className="size-title">{t('wizard.selectSize')}</h4>
                <div className="size-options">
                  {VEHICLE_SIZES[booking.vehicleType]?.map(({ id, icon }) => (
                    <button
                      key={id}
                      className={`size-card ${booking.vehicleSize === id ? 'selected' : ''}`}
                      onClick={() => onSizeSelect(id)}
                    >
                      <span className="size-icon">{icon}</span>
                      <span className="size-name">{t(`wizard.${booking.vehicleType}${id.charAt(0).toUpperCase() + id.slice(1)}`)}</span>
                      <span className="size-desc">{t(`wizard.${booking.vehicleType}${id.charAt(0).toUpperCase() + id.slice(1)}Desc`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

export default VehicleStep;
