/**
 * LocationSelector Component
 * 
 * Allows customers to select their service area during booking.
 * Shows a beautiful map-like interface with service zones.
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useServiceLocations from '../hooks/useServiceLocations';
import './LocationSelector.css';

export function LocationSelector({ 
  selectedLocationId, 
  selectedArea,
  onLocationChange, 
  onAreaChange,
  showPricing = true 
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { activeLocations, loading, getPriceAdjustment } = useServiceLocations();
  const [expandedLocation, setExpandedLocation] = useState(selectedLocationId);

  // Group locations by emirate
  const locationsByEmirate = useMemo(() => {
    const grouped = {};
    activeLocations.forEach(location => {
      const emirate = isRTL ? location.emirateAr : location.emirate;
      if (!grouped[emirate]) {
        grouped[emirate] = [];
      }
      grouped[emirate].push(location);
    });
    return grouped;
  }, [activeLocations, isRTL]);

  if (loading) {
    return (
      <div className="location-selector-loading">
        <div className="loading-spinner" />
        <span>{t('common.loading')}</span>
      </div>
    );
  }

  const handleLocationClick = (location) => {
    setExpandedLocation(location.id === expandedLocation ? null : location.id);
    if (location.id !== selectedLocationId) {
      onLocationChange(location.id);
      onAreaChange(''); // Reset area when location changes
    }
  };

  const handleAreaClick = (location, area) => {
    onLocationChange(location.id);
    onAreaChange(area);
  };

  return (
    <div className={`location-selector ${isRTL ? 'rtl' : ''}`}>
      <h3 className="location-selector-title">
        📍 {t('booking.selectLocation') || 'Select Your Area'}
      </h3>
      
      <div className="location-groups">
        {Object.entries(locationsByEmirate).map(([emirate, locations]) => (
          <div key={emirate} className="emirate-group">
            <h4 className="emirate-title">{emirate}</h4>
            
            <div className="locations-grid">
              {locations.map(location => {
                const isSelected = location.id === selectedLocationId;
                const isExpanded = location.id === expandedLocation;
                const priceAdjustment = getPriceAdjustment(location.id);
                const areas = isRTL ? location.areasAr : location.areas;
                const name = isRTL ? location.nameAr : location.name;

                return (
                  <div 
                    key={location.id} 
                    className={`location-card ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <button
                      type="button"
                      className="location-header"
                      onClick={() => handleLocationClick(location)}
                      aria-expanded={isExpanded}
                    >
                      <div className="location-info">
                        <span className="location-name">{name}</span>
                        <span className="location-time">
                          ⏱️ {location.estimatedTime}
                        </span>
                      </div>
                      
                      {showPricing && priceAdjustment > 0 && (
                        <span className="location-surcharge">
                          +{priceAdjustment} AED
                        </span>
                      )}
                      
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="location-areas">
                        <p className="areas-hint">
                          {t('booking.selectSpecificArea') || 'Select your specific area:'}
                        </p>
                        <div className="areas-list">
                          {areas.map((area, index) => (
                            <button
                              key={area}
                              type="button"
                              className={`area-chip ${selectedArea === area ? 'selected' : ''}`}
                              onClick={() => handleAreaClick(location, area)}
                            >
                              {area}
                              {selectedArea === area && ' ✓'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedLocationId && selectedArea && (
        <div className="selection-summary">
          <span className="summary-icon">✅</span>
          <span className="summary-text">
            {t('booking.selectedArea') || 'Selected'}: <strong>{selectedArea}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

export default LocationSelector;
