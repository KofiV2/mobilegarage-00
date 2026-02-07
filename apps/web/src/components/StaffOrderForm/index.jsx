import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { useToast } from '../Toast';
import { uploadVehicleImage, compressImage } from '../../firebase/storage';
import { PACKAGES, VEHICLE_TYPES } from '../../config/packages';
import { EMIRATES } from '../../config/emirates';
import logger from '../../utils/logger';

// Section components
import VehicleSection, { VehicleImageUpload, VehicleDetailsSection } from './VehicleSection';
import { CustomerPhoneInput, CustomerDetailsSection } from './CustomerSection';
import { LocationAreaInput, LocationDetailsSection } from './LocationSection';
import { PaymentMethodToggle, SubmitSection, NotesField, ConfirmationModal } from './OrderSummary';

import '../StaffOrderForm.css';

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
  const [showMoreDetails, setShowMoreDetails] = useState(false);
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

  // Auto-detect location on mount (background)
  useEffect(() => {
    const detectLocationBackground = async () => {
      try {
        if (!navigator.geolocation) return;

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });

        const { latitude, longitude } = position.coords;

        try {
          const response = await withTimeout(
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            ),
            8000,
            'Geocoding'
          );

          if (response.ok) {
            const data = await response.json();
            if (!data.error) {
              const detectedEmirate = data.address?.state || data.address?.region || data.address?.city || '';
              const area = data.address?.suburb ||
                           data.address?.neighbourhood ||
                           data.address?.city_district ||
                           data.address?.town ||
                           data.address?.village || '';

              const matchedEmirate = EMIRATES.find(e =>
                detectedEmirate.toLowerCase().includes(e.name.toLowerCase())
              );

              setOrder(prev => ({
                ...prev,
                emirate: matchedEmirate?.id || '',
                area: area || prev.area,
                coordinates: { lat: latitude, lng: longitude }
              }));
            }
          }
        } catch {
          // Silent fail for background detection
          setOrder(prev => ({
            ...prev,
            coordinates: { lat: latitude, lng: longitude }
          }));
        }
      } catch {
        // Silent fail - user can enter manually
      }
    };

    detectLocationBackground();
  }, []);

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
    if (order.vehicles.length <= 1) return;
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

  // Validate form
  const validateForm = () => {
    const errors = [];

    order.vehicles.forEach((vehicle) => {
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
    setShowMoreDetails(false);
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

      if (order.vehicleImage) {
        try {
          const compressedImage = await compressImage(order.vehicleImage, 1200, 0.8);
          const compressedFile = new File([compressedImage], order.vehicleImage.name, {
            type: 'image/jpeg'
          });
          vehicleImageUrl = await withTimeout(
            uploadVehicleImage(compressedFile, tempId),
            60000,
            'Image upload'
          );
          showToast(t('staff.imageUpload.uploadSuccess') || 'Image uploaded', 'success');
        } catch (uploadError) {
          logger.error('Image upload failed', uploadError);
          showToast(t('staff.orderForm.imageUploadFailed'), 'warning');
        }
      }

      let formattedPhone = null;
      if (order.customerPhone && order.customerPhone.trim()) {
        formattedPhone = order.customerPhone.startsWith('+971')
          ? order.customerPhone
          : `+971${order.customerPhone.replace(/^0/, '')}`;
      }

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const emirateName = EMIRATES.find(e => e.id === order.emirate)?.name || order.emirate;

      // Create booking via server-side Cloud Function (price calculated server-side)
      const createBookingFn = httpsCallable(functions, 'createBooking');
      const result = await withTimeout(
        createBookingFn({
          vehicleType: order.vehicles[0]?.vehicleType,
          vehicleSize: order.vehicles[0]?.vehicleSize || undefined,
          packageId: order.vehicles[0]?.package,
          date: currentDate,
          timeSlot: currentTime,
          location: {
            emirate: emirateName || undefined,
            area: order.area.trim(),
            street: order.street.trim() || undefined,
            villa: order.villa.trim() || undefined,
            latitude: order.coordinates?.lat || undefined,
            longitude: order.coordinates?.lng || undefined,
          },
          customerData: {
            phone: formattedPhone,
            name: order.customerName.trim() || null,
          },
          vehicleImageUrl,
          vehiclesInArea: parseInt(order.vehiclesInArea) || 1,
          notes: order.notes.trim() || undefined,
          paymentMethod: order.paymentMethod,
          source: 'staff',
          enteredBy: staff?.email || 'unknown',
        }),
        30000,
        'Booking creation'
      );

      const { bookingId, calculatedPrice } = result.data;

      logger.info('Staff order created', {
        orderId: bookingId,
        staff: staff?.email,
        price: calculatedPrice,
        vehicleCount: order.vehicles.length
      });

      setConfirmedOrder({
        orderId: bookingId,
        customerPhone: formattedPhone,
        vehicles: order.vehicles,
        totalPrice: calculatedPrice,
        area: order.area,
        emirate: emirateName,
        paymentMethod: order.paymentMethod
      });
      setShowConfirmation(true);

      if (onOrderSubmitted) {
        onOrderSubmitted(bookingId);
      }
    } catch (error) {
      logger.error('Failed to create staff order', error);
      showToast(t('staff.orderForm.error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Get current vehicle (first one for simplified view)
  const currentVehicle = order.vehicles[0];
  const needsSize = VEHICLE_TYPES.find(v => v.id === currentVehicle?.vehicleType)?.hasSizes || false;

  return (
    <>
      <form className="staff-order-form compact" onSubmit={handleSubmit}>
        {/* Vehicle Type, Size, Package Selection */}
        <VehicleSection
          currentVehicle={currentVehicle}
          vehicles={order.vehicles}
          needsSize={needsSize}
          imageError={imageError}
          isSaving={isSaving}
          vehiclesInArea={order.vehiclesInArea}
          showMoreDetails={showMoreDetails}
          onVehicleChange={handleVehicleChange}
          onImageSelect={handleImageSelect}
          onVehiclesInAreaChange={(val) => handleChange('vehiclesInArea', val)}
          onAddVehicle={addVehicle}
          onRemoveVehicle={removeVehicle}
          getVehiclePrice={getVehiclePrice}
        />

        {/* Area Input - Only Required Field */}
        <LocationAreaInput
          area={order.area}
          onChange={handleChange}
        />

        {/* Payment Method Toggle */}
        <PaymentMethodToggle
          paymentMethod={order.paymentMethod}
          onChange={handleChange}
        />

        {/* Quick Access Row - Phone & Photo */}
        <div className="quick-access-row">
          <CustomerPhoneInput
            customerPhone={order.customerPhone}
            onChange={handleChange}
          />
          <VehicleImageUpload
            onImageSelect={handleImageSelect}
            imageError={imageError}
            isSaving={isSaving}
          />
        </div>

        {/* Submit Section */}
        <SubmitSection
          totalPrice={totalPrice}
          isSaving={isSaving}
        />

        {/* More Details Accordion */}
        <div className="more-details-section">
          <button
            type="button"
            className="more-details-toggle"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
          >
            <span>{showMoreDetails ? '\u2212' : '+'}</span>
            {t('staff.orderForm.moreDetails') || 'More Details'}
          </button>

          {showMoreDetails && (
            <div className="more-details-content">
              {/* Customer Name */}
              <CustomerDetailsSection
                customerName={order.customerName}
                onChange={handleChange}
              />

              {/* Emirate, Street, Villa */}
              <LocationDetailsSection
                emirate={order.emirate}
                street={order.street}
                villa={order.villa}
                onChange={handleChange}
              />

              {/* Vehicles in Area, Multi-Vehicle, Add Vehicle */}
              <VehicleDetailsSection
                vehicles={order.vehicles}
                vehiclesInArea={order.vehiclesInArea}
                onVehiclesInAreaChange={(val) => handleChange('vehiclesInArea', val)}
                onAddVehicle={addVehicle}
                onRemoveVehicle={removeVehicle}
                getVehiclePrice={getVehiclePrice}
              />

              {/* Notes */}
              <NotesField
                notes={order.notes}
                onChange={handleChange}
              />
            </div>
          )}
        </div>
      </form>

      {/* Order Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          confirmedOrder={confirmedOrder}
          onClose={handleCloseConfirmation}
        />
      )}
    </>
  );
};

export default StaffOrderForm;
