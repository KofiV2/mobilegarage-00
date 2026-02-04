import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './VehicleForm.css';

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const VEHICLE_TYPES = ['sedan', 'suv', 'motorcycle', 'caravan', 'boat'];
const SIZE_OPTIONS = ['small', 'medium', 'large'];
const TYPES_WITH_SIZE = ['caravan', 'boat'];

const VehicleForm = ({ isOpen, onClose, onSubmit, vehicle, isLoading }) => {
  const { t } = useTranslation();
  const isEditing = !!vehicle;

  const [formData, setFormData] = useState({
    nickname: '',
    type: 'sedan',
    size: '',
    licensePlate: '',
    isDefault: false
  });
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or vehicle changes
  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        setFormData({
          nickname: vehicle.nickname || '',
          type: vehicle.type || 'sedan',
          size: vehicle.size || '',
          licensePlate: vehicle.licensePlate || '',
          isDefault: vehicle.isDefault || false
        });
      } else {
        setFormData({
          nickname: '',
          type: 'sedan',
          size: '',
          licensePlate: '',
          isDefault: false
        });
      }
      setErrors({});
    }
  }, [isOpen, vehicle]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Clear size if type doesn't require it
      if (field === 'type' && !TYPES_WITH_SIZE.includes(value)) {
        updated.size = '';
      }
      return updated;
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nickname.trim()) {
      newErrors.nickname = t('vehicles.vehicleRequired');
    }

    if (!formData.type) {
      newErrors.type = t('vehicles.typeRequired');
    }

    if (TYPES_WITH_SIZE.includes(formData.type) && !formData.size) {
      newErrors.size = t('vehicles.sizeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const result = await onSubmit(formData);
    if (result?.success) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const needsSize = TYPES_WITH_SIZE.includes(formData.type);

  return (
    <div className="vehicle-form-overlay" onClick={handleBackdropClick}>
      <div className="vehicle-form-modal">
        <div className="vehicle-form-header">
          <h3>{isEditing ? t('vehicles.editVehicle') : t('vehicles.addVehicle')}</h3>
          <button className="close-btn" onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vehicle-form">
          {/* Nickname */}
          <div className="form-group">
            <label htmlFor="nickname">{t('vehicles.nickname')}</label>
            <input
              type="text"
              id="nickname"
              value={formData.nickname}
              onChange={(e) => handleChange('nickname', e.target.value)}
              placeholder={t('vehicles.nicknamePlaceholder')}
              maxLength={30}
              autoFocus
            />
            {errors.nickname && <span className="form-error">{errors.nickname}</span>}
          </div>

          {/* Vehicle Type */}
          <div className="form-group">
            <label>{t('vehicles.type')}</label>
            <div className="type-selector">
              {VEHICLE_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  className={`type-option ${formData.type === type ? 'selected' : ''}`}
                  onClick={() => handleChange('type', type)}
                >
                  {t(`wizard.${type}`)}
                </button>
              ))}
            </div>
            {errors.type && <span className="form-error">{errors.type}</span>}
          </div>

          {/* Size (conditional) */}
          {needsSize && (
            <div className="form-group">
              <label>{t('vehicles.size')}</label>
              <div className="size-selector">
                {SIZE_OPTIONS.map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`size-option ${formData.size === size ? 'selected' : ''}`}
                    onClick={() => handleChange('size', size)}
                  >
                    {t(`wizard.${formData.type}${size.charAt(0).toUpperCase() + size.slice(1)}`)}
                  </button>
                ))}
              </div>
              {errors.size && <span className="form-error">{errors.size}</span>}
            </div>
          )}

          {/* License Plate */}
          <div className="form-group">
            <label htmlFor="licensePlate">{t('vehicles.licensePlate')}</label>
            <input
              type="text"
              id="licensePlate"
              value={formData.licensePlate}
              onChange={(e) => handleChange('licensePlate', e.target.value.toUpperCase())}
              placeholder={t('vehicles.licensePlaceholder')}
              maxLength={15}
            />
          </div>

          {/* Set as Default */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => handleChange('isDefault', e.target.checked)}
              />
              <span className="checkbox-text">{t('vehicles.setDefault')}</span>
            </label>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-loading">
                  <span className="spinner-small"></span>
                </span>
              ) : (
                isEditing ? t('vehicles.updateVehicle') : t('vehicles.saveVehicle')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

VehicleForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  vehicle: PropTypes.shape({
    id: PropTypes.string,
    nickname: PropTypes.string,
    type: PropTypes.string,
    size: PropTypes.string,
    licensePlate: PropTypes.string,
    isDefault: PropTypes.bool
  }),
  isLoading: PropTypes.bool
};

export default VehicleForm;
