import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './VehicleCard.css';

// Vehicle type icons
const VehicleIcons = {
  sedan: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-3l-2-4H7l-2 4v3z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
      <path d="M5 14h14" />
    </svg>
  ),
  suv: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14V9l-2-3H7L5 9v8z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
      <path d="M5 12h14" />
    </svg>
  ),
  motorcycle: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M5 17h6l4-7h4" />
      <path d="M9 9l2 2" />
    </svg>
  ),
  caravan: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="18" height="10" rx="1" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="15" cy="18" r="2" />
      <path d="M20 13h2" />
      <path d="M6 12h4" />
    </svg>
  ),
  boat: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20l2-2h16l2 2" />
      <path d="M4 18l4-10h8l4 10" />
      <path d="M12 8V4" />
      <path d="M12 4l4 4" />
    </svg>
  )
};

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const VehicleCard = ({ vehicle, onEdit, onDelete, onSetDefault, showActions = true }) => {
  const { t } = useTranslation();

  const VehicleIcon = VehicleIcons[vehicle.type] || VehicleIcons.sedan;

  const getVehicleTypeLabel = () => {
    return t(`wizard.${vehicle.type}`, vehicle.type);
  };

  const getSizeLabel = () => {
    if (!vehicle.size) return null;
    const sizeKey = `${vehicle.type}${vehicle.size.charAt(0).toUpperCase() + vehicle.size.slice(1)}`;
    return t(`wizard.${sizeKey}`, vehicle.size);
  };

  return (
    <div className={`vehicle-card ${vehicle.isDefault ? 'is-default' : ''}`}>
      {vehicle.photoUrl ? (
        <div className="vehicle-card-photo">
          <img src={vehicle.photoUrl} alt={vehicle.nickname} />
        </div>
      ) : (
        <div className="vehicle-card-icon">
          <VehicleIcon />
        </div>
      )}

      <div className="vehicle-card-content">
        <div className="vehicle-card-header">
          <h4 className="vehicle-nickname">{vehicle.nickname}</h4>
          {vehicle.isDefault && (
            <span className="default-badge">
              <StarIcon filled />
              {t('vehicles.default')}
            </span>
          )}
        </div>

        <div className="vehicle-card-details">
          <span className="vehicle-type">{getVehicleTypeLabel()}</span>
          {vehicle.size && (
            <>
              <span className="detail-separator">•</span>
              <span className="vehicle-size">{getSizeLabel()}</span>
            </>
          )}
          {vehicle.licensePlate && (
            <>
              <span className="detail-separator">•</span>
              <span className="vehicle-plate">{vehicle.licensePlate}</span>
            </>
          )}
        </div>
      </div>

      {showActions && (
        <div className="vehicle-card-actions">
          {!vehicle.isDefault && onSetDefault && (
            <button
              className="vehicle-action-btn set-default-btn"
              onClick={() => onSetDefault(vehicle.id)}
              title={t('vehicles.setDefault')}
            >
              <StarIcon filled={false} />
            </button>
          )}
          {onEdit && (
            <button
              className="vehicle-action-btn edit-btn"
              onClick={() => onEdit(vehicle)}
              title={t('common.edit')}
            >
              <EditIcon />
            </button>
          )}
          {onDelete && (
            <button
              className="vehicle-action-btn delete-btn"
              onClick={() => onDelete(vehicle.id)}
              title={t('common.delete')}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

VehicleCard.propTypes = {
  vehicle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    size: PropTypes.string,
    licensePlate: PropTypes.string,
    isDefault: PropTypes.bool,
    photoUrl: PropTypes.string,
    photoPath: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onSetDefault: PropTypes.func,
  showActions: PropTypes.bool
};

export default VehicleCard;
