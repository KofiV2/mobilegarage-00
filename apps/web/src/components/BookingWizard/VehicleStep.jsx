import React, { memo, useId } from 'react';
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
  const groupId = useId();
  const sizeGroupId = useId();

  const isSelected = (id) => booking.vehicleType === id && !selectedSavedVehicle;

  return (
    <div className="wizard-step fade-in" role="region" aria-labelledby={`${groupId}-title`}>
      <h3 id={`${groupId}-title`} className="step-title">{t('wizard.step1')}</h3>

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
              aria-label={t('vehicles.useSavedLabel') || 'Go back to saved vehicles'}
            >
              <span className="back-arrow" aria-hidden="true">←</span> {t('vehicles.useSaved')}
            </button>
          )}
          
          {/* Vehicle type selection as a radio group for better a11y */}
          <div 
            className="vehicle-options" 
            role="radiogroup" 
            aria-label={t('wizard.selectVehicleType') || 'Select vehicle type'}
          >
            {VEHICLE_TYPES.map(({ id, icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={isSelected(id)}
                className={`vehicle-card ${isSelected(id) ? 'selected' : ''}`}
                onClick={() => onVehicleSelect(id)}
                aria-label={`${t(`wizard.${id}`)} - ${t(`wizard.${id}Desc`)}`}
              >
                <span className="vehicle-icon" aria-hidden="true">{icon}</span>
                <span className="vehicle-name">{t(`wizard.${id}`)}</span>
                <span className="vehicle-desc">{t(`wizard.${id}Desc`)}</span>
              </button>
            ))}

            {/* Size selection for Boat/Caravan */}
            {booking.vehicleType && VEHICLE_TYPES.find(v => v.id === booking.vehicleType)?.hasSizes && (
              <div className="vehicle-size-section" role="region" aria-labelledby={`${sizeGroupId}-title`}>
                <h4 id={`${sizeGroupId}-title`} className="size-title">{t('wizard.selectSize')}</h4>
                <div 
                  className="size-options"
                  role="radiogroup"
                  aria-label={t('wizard.selectSizeFor', { vehicle: t(`wizard.${booking.vehicleType}`) }) || 'Select size'}
                >
                  {VEHICLE_SIZES[booking.vehicleType]?.map(({ id, icon }) => {
                    const sizeName = t(`wizard.${booking.vehicleType}${id.charAt(0).toUpperCase() + id.slice(1)}`);
                    const sizeDesc = t(`wizard.${booking.vehicleType}${id.charAt(0).toUpperCase() + id.slice(1)}Desc`);
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={booking.vehicleSize === id}
                        className={`size-card ${booking.vehicleSize === id ? 'selected' : ''}`}
                        onClick={() => onSizeSelect(id)}
                        aria-label={`${sizeName} - ${sizeDesc}`}
                      >
                        <span className="size-icon" aria-hidden="true">{icon}</span>
                        <span className="size-name">{sizeName}</span>
                        <span className="size-desc">{sizeDesc}</span>
                      </button>
                    );
                  })}
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
