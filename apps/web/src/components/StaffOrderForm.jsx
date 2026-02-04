import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import { useToast } from './Toast';
import { uploadVehicleImage, compressImage } from '../firebase/storage';
import ImageUpload from './ImageUpload';
import { PACKAGES, VEHICLE_TYPES, VEHICLE_SIZES } from '../config/packages';
import logger from '../utils/logger';
import './StaffOrderForm.css';

// Emirates dropdown options
const EMIRATES = [
  { id: 'dubai', name: 'Dubai' },
  { id: 'sharjah', name: 'Sharjah' },
  { id: 'ajman', name: 'Ajman' }
];

// Helper to add timeout to promises
const withTimeout = (promise, ms, operation = 'Operation') => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${operation} timed out after ${ms / 1000}s`)), ms)
  );
  return Promise.race([promise, timeout]);
};

// Helper to get price for a vehicle
const getVehiclePrice = (vehicle) => {
  if (!vehicle.vehicleType || !vehicle.package) return 0;
  const pkg = PACKAGES[vehicle.package];
  if (!pkg) return 0;

  let priceKey = vehicle.vehicleType;
  const vehicleTypeData = VEHICLE_TYPES.find(v => v.id === vehicle.vehicleType);
  if (vehicleTypeData?.hasSizes && vehicle.vehicleSize) {
    priceKey = `${vehicle.vehicleType}_${vehicle.vehicleSize}`;
  }
  return pkg.prices[priceKey] || 0;
};

const StaffOrderForm = ({ onOrderSubmitted }) => {
  const { t } = useTranslation();
  const { staff } = useStaffAuth();
  const { showToast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Initial vehicle entry
  const createEmptyVehicle = () => ({
    vehicleType: 'sedan',
    vehicleSize: '',
    package: 'platinum'
  });

  const [order, setOrder] = useState({
    customerPhone: '',
    customerName: '',
    vehicles: [createEmptyVehicle()], // Array of vehicles
    emirate: '',
    area: '',
    street: '',
    villa: '',
    vehiclesInArea: 1,
    vehicleImage: null,
    notes: '',
    coordinates: null,
    paymentMethod: 'cash' // 'cash' or 'link'
  });

  // Auto-detect location using GPS + reverse geocoding
  const detectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      logger.info('GPS coordinates obtained', { latitude, longitude });

      let data;
      try {
        const response = await withTimeout(
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          ),
          10000,
          'Geocoding API'
        );

        if (!response.ok) {
          logger.error('Nominatim API error', { status: response.status });
          throw new Error('Geocoding failed');
        }

        data = await response.json();
        logger.info('Nominatim response', { address: data.address });

        // Check if the response contains an error
        if (data.error) {
          logger.error('Nominatim returned error', { error: data.error });
          throw new Error(data.error);
        }
      } catch (fetchError) {
        logger.error('Geocoding fetch failed', fetchError);
        // Still have coordinates, just can't get address - fill what we can
        setOrder(prev => ({
          ...prev,
          coordinates: { lat: latitude, lng: longitude }
        }));
        showToast(t('staff.orderForm.locationDetected') + ' (GPS only)', 'success');
        return;
      }

      // Extract emirate and area from response
      const detectedEmirate = data.address?.state || data.address?.region || data.address?.city || '';
      const area = data.address?.suburb ||
                   data.address?.neighbourhood ||
                   data.address?.city_district ||
                   data.address?.town ||
                   data.address?.village ||
                   data.address?.county ||
                   data.address?.municipality || '';
      const street = data.address?.road || data.address?.street || '';

      // Try to match detected emirate to dropdown options
      const matchedEmirate = EMIRATES.find(e =>
        detectedEmirate.toLowerCase().includes(e.name.toLowerCase())
      );

      setOrder(prev => ({
        ...prev,
        emirate: matchedEmirate?.id || '',
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

  // Calculate total price for all vehicles
  const totalPrice = useMemo(() => {
    return order.vehicles.reduce((sum, vehicle) => sum + getVehiclePrice(vehicle), 0);
  }, [order.vehicles]);

  // Handle input changes for main order fields
  const handleChange = (field, value) => {
    setOrder(prev => ({ ...prev, [field]: value }));
  };

  // Handle vehicle changes
  const handleVehicleChange = (index, field, value) => {
    setOrder(prev => {
      const newVehicles = [...prev.vehicles];
      newVehicles[index] = { ...newVehicles[index], [field]: value };

      // Reset size when vehicle type changes
      if (field === 'vehicleType') {
        const needsSize = VEHICLE_TYPES.find(v => v.id === value)?.hasSizes;
        if (!needsSize) {
          newVehicles[index].vehicleSize = '';
        }
      }

      return { ...prev, vehicles: newVehicles };
    });
  };

  // Add another vehicle
  const addVehicle = () => {
    setOrder(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, createEmptyVehicle()]
    }));
  };

  // Remove a vehicle
  const removeVehicle = (index) => {
    if (order.vehicles.length <= 1) return; // Keep at least one
    setOrder(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index)
    }));
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

  // Validate form - phone and villa are now optional
  const validateForm = () => {
    const errors = [];

    // Check each vehicle has required fields
    order.vehicles.forEach((vehicle, index) => {
      if (!vehicle.vehicleType) {
        errors.push(t('staff.orderForm.errors.vehicleRequired'));
      }

      const needsSize = VEHICLE_TYPES.find(v => v.id === vehicle.vehicleType)?.hasSizes;
      if (needsSize && !vehicle.vehicleSize) {
        errors.push(t('staff.orderForm.errors.sizeRequired'));
      }

      if (!vehicle.package) {
        errors.push(t('staff.orderForm.errors.packageRequired'));
      }
    });

    if (!order.area.trim()) {
      errors.push(t('staff.orderForm.errors.areaRequired'));
    }

    // Phone and villa are now optional - no validation needed

    return errors;
  };

  // Reset form
  const resetForm = () => {
    setOrder({
      customerPhone: '',
      customerName: '',
      vehicles: [createEmptyVehicle()],
      emirate: '',
      area: '',
      street: '',
      villa: '',
      vehiclesInArea: 1,
      vehicleImage: null,
      notes: '',
      coordinates: null,
      paymentMethod: 'cash'
    });
    setImageError(null);
    setLocationError(null);
  };

  // Handle close confirmation modal
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setConfirmedOrder(null);
    resetForm();
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
      const tempId = `order-${Date.now()}`;
      let vehicleImageUrl = null;

      // Upload image if present
      if (order.vehicleImage) {
        try {
          logger.info('Compressing image...');
          const compressedImage = await compressImage(order.vehicleImage, 1200, 0.8);
          const compressedFile = new File([compressedImage], order.vehicleImage.name, {
            type: 'image/jpeg'
          });
          logger.info('Uploading image...');
          vehicleImageUrl = await withTimeout(
            uploadVehicleImage(compressedFile, tempId),
            60000,
            'Image upload'
          );
          logger.info('Image uploaded successfully');
        } catch (uploadError) {
          logger.error('Image upload failed', uploadError);
          showToast(t('staff.orderForm.imageUploadFailed'), 'warning');
        }
      }

      // Format phone number (handle empty phone)
      let formattedPhone = null;
      if (order.customerPhone && order.customerPhone.trim()) {
        formattedPhone = order.customerPhone.startsWith('+971')
          ? order.customerPhone
          : `+971${order.customerPhone.replace(/^0/, '')}`;
      }

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Get emirate name from ID
      const emirateName = EMIRATES.find(e => e.id === order.emirate)?.name || order.emirate;

      // Create booking document
      const bookingData = {
        source: 'staff',
        enteredBy: staff?.email || 'unknown',
        userId: 'staff-entry',

        // Primary vehicle (for backward compatibility)
        vehicleType: order.vehicles[0]?.vehicleType,
        vehicleSize: order.vehicles[0]?.vehicleSize || null,
        package: order.vehicles[0]?.package,

        // All vehicles (new field for multiple vehicles)
        vehicles: order.vehicles,

        date: currentDate,
        time: currentTime,

        location: {
          emirate: emirateName || null,
          area: order.area.trim(),
          street: order.street.trim() || null,
          villa: order.villa.trim() || null,
          instructions: null,
          latitude: order.coordinates?.lat || null,
          longitude: order.coordinates?.lng || null
        },

        customerData: {
          phone: formattedPhone,
          name: order.customerName.trim() || null
        },

        vehicleImageUrl,
        vehiclesInArea: parseInt(order.vehiclesInArea) || 1,
        notes: order.notes.trim() || null,

        paymentMethod: order.paymentMethod,
        price: totalPrice,

        status: 'confirmed',

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      logger.info('Submitting order to Firestore...', { bookingData });

      const docRef = await withTimeout(
        addDoc(collection(db, 'bookings'), bookingData),
        30000,
        'Firestore save'
      );

      logger.info('Staff order created', {
        orderId: docRef.id,
        staff: staff?.email,
        price: totalPrice,
        vehicleCount: order.vehicles.length
      });

      // Show confirmation modal instead of just toast
      setConfirmedOrder({
        orderId: docRef.id,
        customerPhone: formattedPhone,
        vehicles: order.vehicles,
        totalPrice,
        area: order.area,
        emirate: emirateName,
        paymentMethod: order.paymentMethod
      });
      setShowConfirmation(true);

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

  // Render a single vehicle entry
  const renderVehicleEntry = (vehicle, index) => {
    const needsSize = VEHICLE_TYPES.find(v => v.id === vehicle.vehicleType)?.hasSizes || false;
    const vehiclePrice = getVehiclePrice(vehicle);

    return (
      <div key={index} className="vehicle-entry">
        {order.vehicles.length > 1 && (
          <div className="vehicle-entry-header">
            <span className="vehicle-number">{t('staff.orderForm.vehicleNumber', { number: index + 1 })}</span>
            <button
              type="button"
              className="remove-vehicle-btn"
              onClick={() => removeVehicle(index)}
            >
              ✕ {t('staff.orderForm.removeVehicle')}
            </button>
          </div>
        )}

        {/* Vehicle Type Selection */}
        <div className="vehicle-selector">
          {VEHICLE_TYPES.map((vType) => (
            <button
              key={vType.id}
              type="button"
              className={`vehicle-option ${vehicle.vehicleType === vType.id ? 'selected' : ''}`}
              onClick={() => handleVehicleChange(index, 'vehicleType', vType.id)}
            >
              <span className="vehicle-icon">{vType.icon}</span>
              <span className="vehicle-name">{t(`wizard.${vType.id}`)}</span>
            </button>
          ))}
        </div>

        {/* Size selector for caravan/boat */}
        {needsSize && (
          <div className="size-selector">
            <label>{t('staff.orderForm.selectSize')} *</label>
            <div className="size-options">
              {VEHICLE_SIZES[vehicle.vehicleType]?.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  className={`size-option ${vehicle.vehicleSize === size.id ? 'selected' : ''}`}
                  onClick={() => handleVehicleChange(index, 'vehicleSize', size.id)}
                >
                  <span className="size-icon">{size.icon}</span>
                  <span className="size-name">{t(`wizard.${vehicle.vehicleType}${size.id.charAt(0).toUpperCase() + size.id.slice(1)}`)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Package Selection */}
        <div className="package-selector">
          {Object.values(PACKAGES).filter(p => p.available).map((pkg) => {
            let priceKey = vehicle.vehicleType;
            if (needsSize && vehicle.vehicleSize) {
              priceKey = `${vehicle.vehicleType}_${vehicle.vehicleSize}`;
            }
            const price = pkg.prices[priceKey] || 0;

            return (
              <button
                key={pkg.id}
                type="button"
                className={`package-option ${vehicle.package === pkg.id ? 'selected' : ''}`}
                onClick={() => handleVehicleChange(index, 'package', pkg.id)}
              >
                <span className="package-icon">{pkg.icon}</span>
                <span className="package-name">{t(`packages.${pkg.id}.name`)}</span>
                <span className="package-price">AED {price}</span>
              </button>
            );
          })}
        </div>

        {/* Vehicle Price */}
        <div className="vehicle-price">
          <span>{t('staff.orderForm.vehiclePrice')}: </span>
          <strong>AED {vehiclePrice}</strong>
        </div>
      </div>
    );
  };

  return (
    <>
      <form className="staff-order-form" onSubmit={handleSubmit}>
        {/* Customer Info Section */}
        <section className="form-section">
          <h3 className="section-title">
            <span className="section-icon">👤</span>
            {t('staff.orderForm.customerInfo')}
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerPhone">{t('staff.orderForm.phone')}</label>
              <div className="phone-input">
                <span className="phone-prefix">+971</span>
                <input
                  type="tel"
                  id="customerPhone"
                  value={order.customerPhone}
                  onChange={(e) => handleChange('customerPhone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="501234567"
                  maxLength={9}
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

        {/* Vehicles Section */}
        <section className="form-section">
          <h3 className="section-title">
            <span className="section-icon">🚗</span>
            {t('staff.orderForm.vehicleInfo')}
          </h3>

          {order.vehicles.map((vehicle, index) => renderVehicleEntry(vehicle, index))}

          <button
            type="button"
            className="add-vehicle-btn"
            onClick={addVehicle}
          >
            <span>➕</span>
            {t('staff.orderForm.addVehicle')}
          </button>
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
              <select
                id="emirate"
                value={order.emirate}
                onChange={(e) => handleChange('emirate', e.target.value)}
                className="emirate-select"
              >
                <option value="">{t('staff.orderForm.selectEmirate')}</option>
                {EMIRATES.map((emirate) => (
                  <option key={emirate.id} value={emirate.id}>
                    {emirate.name}
                  </option>
                ))}
              </select>
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
              <label htmlFor="villa">{t('staff.orderForm.villa')}</label>
              <input
                type="text"
                id="villa"
                value={order.villa}
                onChange={(e) => handleChange('villa', e.target.value)}
                placeholder={t('staff.orderForm.villaPlaceholder')}
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

        {/* Payment Method Section */}
        <section className="form-section">
          <h3 className="section-title">
            <span className="section-icon">💳</span>
            {t('staff.orderForm.paymentMethod')}
          </h3>

          <div className="payment-method-selector">
            <button
              type="button"
              className={`payment-option ${order.paymentMethod === 'cash' ? 'selected' : ''}`}
              onClick={() => handleChange('paymentMethod', 'cash')}
            >
              <span className="payment-icon">💵</span>
              <span className="payment-name">{t('staff.orderForm.cash')}</span>
            </button>
            <button
              type="button"
              className={`payment-option ${order.paymentMethod === 'link' ? 'selected' : ''}`}
              onClick={() => handleChange('paymentMethod', 'link')}
            >
              <span className="payment-icon">🔗</span>
              <span className="payment-name">{t('staff.orderForm.paymentLink')}</span>
            </button>
          </div>
        </section>

        {/* Price Summary */}
        <div className="price-summary">
          <span className="price-label">{t('staff.orderForm.totalPrice')}</span>
          <span className="price-value">AED {totalPrice}</span>
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

      {/* Order Confirmation Modal */}
      {showConfirmation && confirmedOrder && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-icon">✅</div>
            <h3>{t('staff.orderForm.orderConfirmed')}</h3>
            <p className="confirmation-message">{t('staff.orderForm.orderInSystem')}</p>

            <div className="order-details">
              <div className="detail-row">
                <span className="detail-label">Order ID:</span>
                <span className="detail-value">{confirmedOrder.orderId.slice(-8)}</span>
              </div>
              {confirmedOrder.emirate && (
                <div className="detail-row">
                  <span className="detail-label">{t('staff.orderForm.emirate')}:</span>
                  <span className="detail-value">{confirmedOrder.emirate}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">{t('staff.orderForm.area')}:</span>
                <span className="detail-value">{confirmedOrder.area}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('staff.orderForm.vehicles')}:</span>
                <span className="detail-value">{confirmedOrder.vehicles.length}</span>
              </div>
              {confirmedOrder.vehicles.map((v, i) => (
                <div key={i} className="detail-row vehicle-detail">
                  <span className="detail-label">{i + 1}.</span>
                  <span className="detail-value">{t(`wizard.${v.vehicleType}`)} - {t(`packages.${v.package}.name`)}</span>
                </div>
              ))}
              <div className="detail-row">
                <span className="detail-label">{t('staff.orderForm.paymentMethod')}:</span>
                <span className="detail-value">
                  {confirmedOrder.paymentMethod === 'cash' ? `💵 ${t('staff.orderForm.cash')}` : `🔗 ${t('staff.orderForm.paymentLink')}`}
                </span>
              </div>
              <div className="detail-row total">
                <span className="detail-label">{t('staff.orderForm.totalPrice')}:</span>
                <span className="detail-value">AED {confirmedOrder.totalPrice}</span>
              </div>
            </div>

            <button
              className="new-order-btn"
              onClick={handleCloseConfirmation}
            >
              {t('staff.orderForm.newOrder')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffOrderForm;
