import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import { useToast } from './Toast';
import { uploadVehicleImage, compressImage } from '../firebase/storage';
import ImageUpload from './ImageUpload';
import logger from '../utils/logger';
import './StaffOrderForm.css';

const VEHICLE_TYPES = [
  { id: 'sedan', icon: '🚗', hasSizes: false },
  { id: 'suv', icon: '🚙', hasSizes: false },
  { id: 'motorcycle', icon: '🏍️', hasSizes: false },
  { id: 'caravan', icon: '🚐', hasSizes: true },
  { id: 'boat', icon: '🚤', hasSizes: true }
];

const VEHICLE_SIZES = {
  caravan: [
    { id: 'small', icon: '🚐' },
    { id: 'medium', icon: '🚐' },
    { id: 'large', icon: '🚐' }
  ],
  boat: [
    { id: 'small', icon: '🚤' },
    { id: 'medium', icon: '🛥️' },
    { id: 'large', icon: '🚢' }
  ]
};

const PACKAGES = {
  platinum: {
    id: 'platinum',
    prices: {
      sedan: 45,
      suv: 50,
      motorcycle: 30,
      caravan_small: 60,
      caravan_medium: 80,
      caravan_large: 120,
      boat_small: 80,
      boat_medium: 120,
      boat_large: 180
    },
    icon: '🥈',
    available: true
  },
  titanium: {
    id: 'titanium',
    prices: {
      sedan: 75,
      suv: 80,
      motorcycle: 50,
      caravan_small: 100,
      caravan_medium: 130,
      caravan_large: 180,
      boat_small: 120,
      boat_medium: 180,
      boat_large: 280
    },
    icon: '🏆',
    available: true
  }
};

const StaffOrderForm = ({ onOrderSubmitted }) => {
  const { t } = useTranslation();
  const { staff } = useStaffAuth();
  const { showToast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const [order, setOrder] = useState({
    customerPhone: '',
    customerName: '',
    vehicleType: 'sedan',
    vehicleSize: '',
    package: 'platinum',
    emirate: '',
    area: '',
    street: '',
    villa: '',
    vehiclesInArea: 1,
    vehicleImage: null,
    notes: '',
    coordinates: null
  });

  // Auto-detect location using GPS + reverse geocoding
  const detectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError(null);

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }

      // Get GPS coordinates
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode with Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();

      // Extract emirate and area from response
      const emirate = data.address?.state || data.address?.region || '';
      const area = data.address?.suburb ||
                   data.address?.neighbourhood ||
                   data.address?.city_district ||
                   data.address?.town || '';
      const street = data.address?.road || '';

      // Update form with detected location
      setOrder(prev => ({
        ...prev,
        emirate,
        area,
        street: street || prev.street,
        coordinates: { lat: latitude, lng: longitude }
      }));

      showToast(t('staff.orderForm.locationDetected'), 'success');
    } catch (error) {
      logger.error('Location detection failed', error);

      let errorMessage = t('staff.orderForm.locationError');
      if (error.code === 1) {
        errorMessage = t('staff.orderForm.locationDenied');
      } else if (error.code === 2) {
        errorMessage = t('staff.orderForm.locationUnavailable');
      } else if (error.code === 3) {
        errorMessage = t('staff.orderForm.locationTimeout');
      }

      setLocationError(errorMessage);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Calculate price based on vehicle type and package
  const calculatedPrice = useMemo(() => {
    const { vehicleType, vehicleSize, package: pkg } = order;
    if (!vehicleType || !pkg) return 0;

    const packageData = PACKAGES[pkg];
    if (!packageData) return 0;

    let priceKey = vehicleType;
    if (VEHICLE_TYPES.find(v => v.id === vehicleType)?.hasSizes && vehicleSize) {
      priceKey = `${vehicleType}_${vehicleSize}`;
    }

    return packageData.prices[priceKey] || 0;
  }, [order.vehicleType, order.vehicleSize, order.package]);

  // Check if vehicle type needs size selection
  const needsSizeSelection = useMemo(() => {
    return VEHICLE_TYPES.find(v => v.id === order.vehicleType)?.hasSizes || false;
  }, [order.vehicleType]);

  // Handle input changes
  const handleChange = (field, value) => {
    setOrder(prev => {
      const newState = { ...prev, [field]: value };

      // Reset size when vehicle type changes
      if (field === 'vehicleType') {
        const needsSize = VEHICLE_TYPES.find(v => v.id === value)?.hasSizes;
        if (!needsSize) {
          newState.vehicleSize = '';
        }
      }

      return newState;
    });
  };

  // Handle image selection
  const handleImageSelect = (file, error) => {
    if (error) {
      setImageError(error);
      setOrder(prev => ({ ...prev, vehicleImage: null }));
    } else {
      setImageError(null);
      setOrder(prev => ({ ...prev, vehicleImage: file }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!order.customerPhone || order.customerPhone.length < 9) {
      errors.push(t('staff.orderForm.errors.phoneRequired'));
    }

    if (!order.vehicleType) {
      errors.push(t('staff.orderForm.errors.vehicleRequired'));
    }

    if (needsSizeSelection && !order.vehicleSize) {
      errors.push(t('staff.orderForm.errors.sizeRequired'));
    }

    if (!order.package) {
      errors.push(t('staff.orderForm.errors.packageRequired'));
    }

    if (!order.area.trim()) {
      errors.push(t('staff.orderForm.errors.areaRequired'));
    }

    if (!order.villa.trim()) {
      errors.push(t('staff.orderForm.errors.villaRequired'));
    }

    return errors;
  };

  // Reset form
  const resetForm = () => {
    setOrder({
      customerPhone: '',
      customerName: '',
      vehicleType: 'sedan',
      vehicleSize: '',
      package: 'platinum',
      emirate: '',
      area: '',
      street: '',
      villa: '',
      vehiclesInArea: 1,
      vehicleImage: null,
      notes: '',
      coordinates: null
    });
    setImageError(null);
    setLocationError(null);
  };

  // Submit order
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      showToast(errors[0], 'error');
      return;
    }

    setIsSaving(true);

    try {
      // Generate a temporary ID for the order
      const tempId = `order-${Date.now()}`;
      let vehicleImageUrl = null;

      // Upload image if present
      if (order.vehicleImage) {
        try {
          // Compress image before upload
          const compressedImage = await compressImage(order.vehicleImage, 1200, 0.8);
          // Create a File from the Blob
          const compressedFile = new File([compressedImage], order.vehicleImage.name, {
            type: 'image/jpeg'
          });
          vehicleImageUrl = await uploadVehicleImage(compressedFile, tempId);
        } catch (uploadError) {
          logger.error('Image upload failed', uploadError);
          // Continue without image
          showToast(t('staff.orderForm.imageUploadFailed'), 'warning');
        }
      }

      // Format phone number
      const formattedPhone = order.customerPhone.startsWith('+971')
        ? order.customerPhone
        : `+971${order.customerPhone.replace(/^0/, '')}`;

      // Get current date and time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Create booking document
      const bookingData = {
        // Source tracking
        source: 'staff',
        enteredBy: staff?.email || 'unknown',

        // User reference
        userId: 'staff-entry',

        // Vehicle info
        vehicleType: order.vehicleType,
        vehicleSize: needsSizeSelection ? order.vehicleSize : null,

        // Package
        package: order.package,

        // Date/Time (current)
        date: currentDate,
        time: currentTime,

        // Location
        location: {
          emirate: order.emirate.trim() || null,
          area: order.area.trim(),
          street: order.street.trim() || null,
          villa: order.villa.trim(),
          instructions: null,
          latitude: order.coordinates?.lat || null,
          longitude: order.coordinates?.lng || null
        },

        // Customer data
        customerData: {
          phone: formattedPhone,
          name: order.customerName.trim() || null
        },

        // Staff-specific fields
        vehicleImageUrl,
        vehiclesInArea: parseInt(order.vehiclesInArea) || 1,
        notes: order.notes.trim() || null,

        // Payment
        paymentMethod: 'cash',
        price: calculatedPrice,

        // Status - staff orders start as confirmed
        status: 'confirmed',

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      logger.info('Staff order created', {
        orderId: docRef.id,
        staff: staff?.email,
        price: calculatedPrice
      });

      showToast(t('staff.orderForm.success'), 'success');
      resetForm();

      // Callback
      if (onOrderSubmitted) {
        onOrderSubmitted(docRef.id);
      }
    } catch (error) {
      logger.error('Failed to create staff order', error);
      showToast(t('staff.orderForm.error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="staff-order-form" onSubmit={handleSubmit}>
      {/* Customer Info Section */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">👤</span>
          {t('staff.orderForm.customerInfo')}
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="customerPhone">{t('staff.orderForm.phone')} *</label>
            <div className="phone-input">
              <span className="phone-prefix">+971</span>
              <input
                type="tel"
                id="customerPhone"
                value={order.customerPhone}
                onChange={(e) => handleChange('customerPhone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="501234567"
                maxLength={9}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="customerName">{t('staff.orderForm.name')}</label>
            <input
              type="text"
              id="customerName"
              value={order.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              placeholder={t('staff.orderForm.namePlaceholder')}
            />
          </div>
        </div>
      </section>

      {/* Vehicle Section */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">🚗</span>
          {t('staff.orderForm.vehicleInfo')}
        </h3>

        <div className="vehicle-selector">
          {VEHICLE_TYPES.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              className={`vehicle-option ${order.vehicleType === vehicle.id ? 'selected' : ''}`}
              onClick={() => handleChange('vehicleType', vehicle.id)}
            >
              <span className="vehicle-icon">{vehicle.icon}</span>
              <span className="vehicle-name">{t(`wizard.${vehicle.id}`)}</span>
            </button>
          ))}
        </div>

        {/* Size selector for caravan/boat */}
        {needsSizeSelection && (
          <div className="size-selector">
            <label>{t('staff.orderForm.selectSize')} *</label>
            <div className="size-options">
              {VEHICLE_SIZES[order.vehicleType]?.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  className={`size-option ${order.vehicleSize === size.id ? 'selected' : ''}`}
                  onClick={() => handleChange('vehicleSize', size.id)}
                >
                  <span className="size-icon">{size.icon}</span>
                  <span className="size-name">{t(`wizard.${order.vehicleType}${size.id.charAt(0).toUpperCase() + size.id.slice(1)}`)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Package Section */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">📦</span>
          {t('staff.orderForm.packageInfo')}
        </h3>

        <div className="package-selector">
          {Object.values(PACKAGES).filter(p => p.available).map((pkg) => {
            let priceKey = order.vehicleType;
            if (needsSizeSelection && order.vehicleSize) {
              priceKey = `${order.vehicleType}_${order.vehicleSize}`;
            }
            const price = pkg.prices[priceKey] || 0;

            return (
              <button
                key={pkg.id}
                type="button"
                className={`package-option ${order.package === pkg.id ? 'selected' : ''}`}
                onClick={() => handleChange('package', pkg.id)}
              >
                <span className="package-icon">{pkg.icon}</span>
                <span className="package-name">{t(`packages.${pkg.id}.name`)}</span>
                <span className="package-price">AED {price}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Location Section */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">📍</span>
          {t('staff.orderForm.locationInfo')}
        </h3>

        {/* Auto-detect Location Button */}
        <div className="detect-location-wrapper">
          <button
            type="button"
            className={`detect-location-btn ${isDetectingLocation ? 'loading' : ''}`}
            onClick={detectLocation}
            disabled={isDetectingLocation || isSaving}
          >
            {isDetectingLocation ? (
              <>
                <span className="btn-spinner"></span>
                {t('staff.orderForm.detecting')}
              </>
            ) : (
              <>
                <span>📍</span>
                {t('staff.orderForm.detectLocation')}
              </>
            )}
          </button>
          {locationError && (
            <p className="location-error">{locationError}</p>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="emirate">{t('staff.orderForm.emirate')}</label>
            <input
              type="text"
              id="emirate"
              value={order.emirate}
              onChange={(e) => handleChange('emirate', e.target.value)}
              placeholder={t('staff.orderForm.emiratePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="area">{t('staff.orderForm.area')} *</label>
            <input
              type="text"
              id="area"
              value={order.area}
              onChange={(e) => handleChange('area', e.target.value)}
              placeholder={t('staff.orderForm.areaPlaceholder')}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="street">{t('staff.orderForm.street')}</label>
            <input
              type="text"
              id="street"
              value={order.street}
              onChange={(e) => handleChange('street', e.target.value)}
              placeholder={t('staff.orderForm.streetPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="villa">{t('staff.orderForm.villa')} *</label>
            <input
              type="text"
              id="villa"
              value={order.villa}
              onChange={(e) => handleChange('villa', e.target.value)}
              placeholder={t('staff.orderForm.villaPlaceholder')}
              required
            />
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="form-section">
        <h3 className="section-title">
          <span className="section-icon">📋</span>
          {t('staff.orderForm.additionalInfo')}
        </h3>

        <div className="form-row">
          <div className="form-group vehicles-count">
            <label htmlFor="vehiclesInArea">{t('staff.orderForm.vehiclesInArea')}</label>
            <div className="counter-input">
              <button
                type="button"
                onClick={() => handleChange('vehiclesInArea', Math.max(1, order.vehiclesInArea - 1))}
                disabled={order.vehiclesInArea <= 1}
              >
                -
              </button>
              <input
                type="number"
                id="vehiclesInArea"
                value={order.vehiclesInArea}
                onChange={(e) => handleChange('vehiclesInArea', Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                min={1}
                max={20}
              />
              <button
                type="button"
                onClick={() => handleChange('vehiclesInArea', Math.min(20, order.vehiclesInArea + 1))}
                disabled={order.vehiclesInArea >= 20}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>{t('staff.orderForm.vehiclePhoto')}</label>
          <ImageUpload
            onImageSelect={handleImageSelect}
            error={imageError}
            disabled={isSaving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">{t('staff.orderForm.notes')}</label>
          <textarea
            id="notes"
            value={order.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder={t('staff.orderForm.notesPlaceholder')}
            rows={3}
          />
        </div>
      </section>

      {/* Price Summary */}
      <div className="price-summary">
        <span className="price-label">{t('staff.orderForm.totalPrice')}</span>
        <span className="price-value">AED {calculatedPrice}</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="submit-btn"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <span className="btn-spinner"></span>
            {t('staff.orderForm.submitting')}
          </>
        ) : (
          <>
            <span>📝</span>
            {t('staff.orderForm.submit')}
          </>
        )}
      </button>
    </form>
  );
};

export default StaffOrderForm;
