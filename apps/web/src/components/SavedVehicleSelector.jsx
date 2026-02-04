import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './SavedVehicleSelector.css';

// Vehicle type icons (matching VehicleCard)
const VehicleIcons = {
  sedan: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-3l-2-4H7l-2 4v3z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
      <path d="M5 14h14" />
    </svg>
  ),
  suv: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14V9l-2-3H7L5 9v8z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
      <path d="M5 12h14" />
    </svg>
  ),
  motorcycle: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M5 17h6l4-7h4" />
      <path d="M9 9l2 2" />
    </svg>
  ),
  caravan: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="18" height="10" rx="1" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="15" cy="18" r="2" />
      <path d="M20 13h2" />
      <path d="M6 12h4" />
    </svg>
  ),
  boat: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20l2-2h16l2 2" />
      <path d="M4 18l4-10h8l4 10" />
      <path d="M12 8V4" />
      <path d="M12 4l4 4" />
    </svg>
  )
};

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SavedVehicleSelector = ({
  vehicles,
  selectedVehicleId,
  onSelect,
  onSkip,
  showSkipOption = true
}) => {
  const { t } = useTranslation();

  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  const getVehicleTypeLabel = (type) => {
    return t(`wizard.${type}`, type);
  };

  const getSizeLabel = (vehicle) => {
    if (!vehicle.size) return null;
    const sizeKey = `${vehicle.type}${vehicle.size.charAt(0).toUpperCase() + vehicle.size.slice(1)}`;
    return t(`wizard.${sizeKey}`, vehicle.size);
  };

  return (
    <div className="saved-vehicle-selector">
      <div className="selector-header">
        <h4>{t('vehicles.useSaved')}</h4>
        {showSkipOption && (
          <button className="skip-btn" onClick={onSkip}>
            {t('vehicles.selectManually')}
          </button>
        )}
      </div>

      <div className="saved-vehicles-grid">
        {vehicles.map(vehicle => {
          const VehicleIcon = VehicleIcons[vehicle.type] || VehicleIcons.sedan;
          const isSelected = selectedVehicleId === vehicle.id;

          return (
            <button
              key={vehicle.id}
              className={`saved-vehicle-option ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(vehicle)}
            >
              {isSelected && (
                <span className="selected-check">
                  <CheckIcon />
                </span>
              )}

              <div className="vehicle-option-icon">
                <VehicleIcon />
              </div>

              <div className="vehicle-option-info">
                <span className="vehicle-option-nickname">
                  {vehicle.nickname}
                  {vehicle.isDefault && (
                    <span className="default-star" title={t('vehicles.default')}>
                      <StarIcon />
                    </span>
                  )}
                </span>
                <span className="vehicle-option-details">
                  {getVehicleTypeLabel(vehicle.type)}
                  {vehicle.size && ` • ${getSizeLabel(vehicle)}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

SavedVehicleSelector.propTypes = {
  vehicles: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    size: PropTypes.string,
    isDefault: PropTypes.bool
  })).isRequired,
  selectedVehicleId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onSkip: PropTypes.func,
  showSkipOption: PropTypes.bool
};

export default SavedVehicleSelector;
