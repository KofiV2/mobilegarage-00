import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useVehicles } from '../hooks/useVehicles';
import VehicleCard from './VehicleCard';
import VehicleForm from './VehicleForm';
import ConfirmDialog from './ConfirmDialog';
import './SavedVehicles.css';

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CarIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17h14v-3l-2-4H7l-2 4v3z" />
    <circle cx="7.5" cy="17.5" r="1.5" />
    <circle cx="16.5" cy="17.5" r="1.5" />
    <path d="M5 14h14" />
  </svg>
);

const SavedVehicles = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isGuest } = useAuth();
  const {
    vehicles,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setDefaultVehicle,
    canAddMore,
    maxVehicles
  } = useVehicles();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, vehicleId: null });

  // Show sign-in prompt for guests
  if (!isAuthenticated || isGuest) {
    return (
      <div className="saved-vehicles-section">
        <div className="section-header">
          <h3>{t('vehicles.title')}</h3>
        </div>
        <div className="guest-prompt">
          <CarIcon />
          <p>{t('vehicles.signInToSave')}</p>
        </div>
      </div>
    );
  }

  const handleAddClick = () => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (vehicle) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (vehicleId) => {
    setDeleteConfirm({ open: true, vehicleId });
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingVehicle) {
        const result = await updateVehicle(editingVehicle.id, formData);
        return result;
      } else {
        const result = await addVehicle(formData);
        return result;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.vehicleId) {
      await deleteVehicle(deleteConfirm.vehicleId);
    }
    setDeleteConfirm({ open: false, vehicleId: null });
  };

  const handleSetDefault = async (vehicleId) => {
    await setDefaultVehicle(vehicleId);
  };

  if (loading) {
    return (
      <div className="saved-vehicles-section">
        <div className="section-header">
          <h3>{t('vehicles.title')}</h3>
        </div>
        <div className="vehicles-loading">
          <div className="vehicle-skeleton" />
          <div className="vehicle-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="saved-vehicles-section">
      <div className="section-header">
        <div className="header-text">
          <h3>{t('vehicles.title')}</h3>
          <span className="vehicle-count">{vehicles.length}/{maxVehicles}</span>
        </div>
        {canAddMore && (
          <button className="add-vehicle-btn" onClick={handleAddClick}>
            <PlusIcon />
            {t('vehicles.addVehicle')}
          </button>
        )}
      </div>

      {vehicles.length === 0 ? (
        <div className="no-vehicles">
          <CarIcon />
          <p className="no-vehicles-title">{t('vehicles.noVehicles')}</p>
          <p className="no-vehicles-desc">{t('vehicles.noVehiclesDesc')}</p>
          <button className="add-first-btn" onClick={handleAddClick}>
            <PlusIcon />
            {t('vehicles.addVehicle')}
          </button>
        </div>
      ) : (
        <div className="vehicles-list">
          {vehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {!canAddMore && vehicles.length > 0 && (
        <p className="max-reached">{t('vehicles.maxReached')}</p>
      )}

      <VehicleForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        vehicle={editingVehicle}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title={t('vehicles.deleteVehicle')}
        message={t('vehicles.deleteConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, vehicleId: null })}
        variant="danger"
      />
    </div>
  );
};

export default SavedVehicles;
