/**
 * LocationManager Component
 * 
 * Manager interface for configuring service locations/branches.
 * Allows adding, editing, and toggling locations.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useServiceLocations from '../../hooks/useServiceLocations';
import { useToast } from '../../components/Toast';
import './LocationManager.css';

export function LocationManager({ onClose }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { showToast } = useToast();
  const { 
    locations, 
    loading, 
    updateLocation, 
    toggleLocationActive,
    addLocation,
    deleteLocation,
    initializeDefaults,
    DEFAULT_LOCATIONS
  } = useServiceLocations();

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    nameAr: '',
    emirate: 'Dubai',
    emirateAr: 'دبي',
    areas: '',
    areasAr: '',
    basePrice: 0,
    estimatedTime: '45-60 min',
    isActive: true,
    priority: 10,
  });

  const handleToggleActive = async (locationId) => {
    const result = await toggleLocationActive(locationId);
    if (result.success) {
      showToast(t('locations.statusUpdated') || 'Location status updated', 'success');
    } else {
      showToast(result.error, 'error');
    }
  };

  const handleEdit = (location) => {
    setEditingId(location.id);
    setEditForm({
      ...location,
      areas: location.areas.join(', '),
      areasAr: location.areasAr.join('، '),
    });
  };

  const handleSaveEdit = async () => {
    const updates = {
      ...editForm,
      areas: editForm.areas.split(/[,،]/).map(a => a.trim()).filter(Boolean),
      areasAr: editForm.areasAr.split(/[,،]/).map(a => a.trim()).filter(Boolean),
      basePrice: parseFloat(editForm.basePrice) || 0,
      priority: parseInt(editForm.priority) || 10,
    };

    const result = await updateLocation(editingId, updates);
    if (result.success) {
      showToast(t('locations.saved') || 'Location saved', 'success');
      setEditingId(null);
    } else {
      showToast(result.error, 'error');
    }
  };

  const handleAddLocation = async () => {
    const locationData = {
      ...newLocation,
      areas: newLocation.areas.split(/[,،]/).map(a => a.trim()).filter(Boolean),
      areasAr: newLocation.areasAr.split(/[,،]/).map(a => a.trim()).filter(Boolean),
      basePrice: parseFloat(newLocation.basePrice) || 0,
      priority: parseInt(newLocation.priority) || 10,
      coordinates: { lat: 25.2, lng: 55.3 },
    };

    const result = await addLocation(locationData);
    if (result.success) {
      showToast(t('locations.added') || 'Location added', 'success');
      setShowAddForm(false);
      setNewLocation({
        name: '',
        nameAr: '',
        emirate: 'Dubai',
        emirateAr: 'دبي',
        areas: '',
        areasAr: '',
        basePrice: 0,
        estimatedTime: '45-60 min',
        isActive: true,
        priority: 10,
      });
    } else {
      showToast(result.error, 'error');
    }
  };

  const handleInitDefaults = async () => {
    const result = await initializeDefaults();
    if (result.success) {
      showToast(t('locations.initialized') || 'Default locations loaded', 'success');
    } else {
      showToast(result.error, 'error');
    }
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm(t('locations.deleteConfirm') || 'Delete this location?')) {
      return;
    }
    const result = await deleteLocation(locationId);
    if (result.success) {
      showToast(t('locations.deleted') || 'Location deleted', 'success');
    } else {
      showToast(result.error, 'error');
    }
  };

  const emirates = ['Dubai', 'Sharjah', 'Ajman', 'Abu Dhabi', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

  return (
    <div className="location-manager-overlay">
      <div className={`location-manager-modal ${isRTL ? 'rtl' : ''}`}>
        <div className="location-manager-header">
          <h2>📍 {t('locations.title') || 'Service Locations'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="location-manager-content">
          <div className="location-actions">
            <button 
              className="btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              ➕ {t('locations.addNew') || 'Add Location'}
            </button>
            {locations.length === 0 && (
              <button 
                className="btn-secondary"
                onClick={handleInitDefaults}
              >
                🔄 {t('locations.loadDefaults') || 'Load Default Locations'}
              </button>
            )}
          </div>

          {/* Add New Location Form */}
          {showAddForm && (
            <div className="location-form add-form">
              <h3>{t('locations.addNew') || 'Add New Location'}</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('locations.name') || 'Name (EN)'}</label>
                  <input
                    type="text"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                    placeholder="e.g., Dubai Marina"
                  />
                </div>
                <div className="form-group">
                  <label>{t('locations.nameAr') || 'Name (AR)'}</label>
                  <input
                    type="text"
                    value={newLocation.nameAr}
                    onChange={(e) => setNewLocation({...newLocation, nameAr: e.target.value})}
                    placeholder="مثال: دبي مارينا"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('locations.emirate') || 'Emirate'}</label>
                  <select
                    value={newLocation.emirate}
                    onChange={(e) => setNewLocation({...newLocation, emirate: e.target.value})}
                  >
                    {emirates.map(em => (
                      <option key={em} value={em}>{em}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('locations.surcharge') || 'Surcharge (AED)'}</label>
                  <input
                    type="number"
                    value={newLocation.basePrice}
                    onChange={(e) => setNewLocation({...newLocation, basePrice: e.target.value})}
                    min="0"
                    step="5"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('locations.areas') || 'Areas (EN, comma-separated)'}</label>
                <input
                  type="text"
                  value={newLocation.areas}
                  onChange={(e) => setNewLocation({...newLocation, areas: e.target.value})}
                  placeholder="Marina, JBR, JLT, Palm Jumeirah"
                />
              </div>

              <div className="form-group">
                <label>{t('locations.areasAr') || 'Areas (AR, comma-separated)'}</label>
                <input
                  type="text"
                  value={newLocation.areasAr}
                  onChange={(e) => setNewLocation({...newLocation, areasAr: e.target.value})}
                  placeholder="مارينا، جي بي آر، أبراج بحيرات جميرا"
                  dir="rtl"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('locations.estimatedTime') || 'Est. Time'}</label>
                  <input
                    type="text"
                    value={newLocation.estimatedTime}
                    onChange={(e) => setNewLocation({...newLocation, estimatedTime: e.target.value})}
                    placeholder="45-60 min"
                  />
                </div>
                <div className="form-group">
                  <label>{t('locations.priority') || 'Priority (order)'}</label>
                  <input
                    type="number"
                    value={newLocation.priority}
                    onChange={(e) => setNewLocation({...newLocation, priority: e.target.value})}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button className="btn-primary" onClick={handleAddLocation}>
                  {t('common.save') || 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* Locations List */}
          <div className="locations-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <span>{t('common.loading') || 'Loading...'}</span>
              </div>
            ) : locations.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📍</span>
                <p>{t('locations.noLocations') || 'No service locations configured'}</p>
                <p className="hint">{t('locations.addFirst') || 'Add your first location or load defaults'}</p>
              </div>
            ) : (
              locations.map(location => (
                <div 
                  key={location.id} 
                  className={`location-item ${!location.isActive ? 'inactive' : ''}`}
                >
                  {editingId === location.id ? (
                    // Edit Form
                    <div className="location-edit-form">
                      <div className="form-row">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          placeholder="Name (EN)"
                        />
                        <input
                          type="text"
                          value={editForm.nameAr}
                          onChange={(e) => setEditForm({...editForm, nameAr: e.target.value})}
                          placeholder="الاسم"
                          dir="rtl"
                        />
                      </div>
                      <div className="form-row">
                        <input
                          type="text"
                          value={editForm.areas}
                          onChange={(e) => setEditForm({...editForm, areas: e.target.value})}
                          placeholder="Areas (comma-separated)"
                        />
                        <input
                          type="number"
                          value={editForm.basePrice}
                          onChange={(e) => setEditForm({...editForm, basePrice: e.target.value})}
                          placeholder="Surcharge"
                          min="0"
                        />
                      </div>
                      <div className="form-actions">
                        <button className="btn-secondary" onClick={() => setEditingId(null)}>
                          {t('common.cancel') || 'Cancel'}
                        </button>
                        <button className="btn-primary" onClick={handleSaveEdit}>
                          {t('common.save') || 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display View
                    <>
                      <div className="location-info">
                        <div className="location-header-row">
                          <h4>{isRTL ? location.nameAr : location.name}</h4>
                          <span className={`status-badge ${location.isActive ? 'active' : 'inactive'}`}>
                            {location.isActive ? '✓ Active' : '✗ Inactive'}
                          </span>
                        </div>
                        <div className="location-details">
                          <span className="detail">
                            🏙️ {isRTL ? location.emirateAr : location.emirate}
                          </span>
                          <span className="detail">
                            ⏱️ {location.estimatedTime}
                          </span>
                          {location.basePrice > 0 && (
                            <span className="detail surcharge">
                              +{location.basePrice} AED
                            </span>
                          )}
                        </div>
                        <div className="location-areas">
                          {(isRTL ? location.areasAr : location.areas).slice(0, 4).map(area => (
                            <span key={area} className="area-tag">{area}</span>
                          ))}
                          {location.areas.length > 4 && (
                            <span className="area-tag more">+{location.areas.length - 4}</span>
                          )}
                        </div>
                      </div>
                      <div className="location-actions-row">
                        <button 
                          className="btn-icon" 
                          onClick={() => handleToggleActive(location.id)}
                          title={location.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {location.isActive ? '🔴' : '🟢'}
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleEdit(location)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon danger" 
                          onClick={() => handleDelete(location.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocationManager;
