import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './BookingWizard.css';

const WHATSAPP_NUMBER = '9710554995611';

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
  },
  diamond: {
    id: 'diamond',
    prices: {
      sedan: null,
      suv: null,
      motorcycle: null,
      caravan_small: null,
      caravan_medium: null,
      caravan_large: null,
      boat_small: null,
      boat_medium: null,
      boat_large: null
    },
    icon: '💎',
    available: false
  }
};

// Generate time slots from 12 PM to 12 AM (midnight)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 12; hour <= 23; hour++) {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    slots.push({
      id: `${hour}:00`,
      label: `${displayHour}:00 ${period}`,
      hour: hour
    });
  }
  // Add 12 AM (midnight)
  slots.push({
    id: '24:00',
    label: '12:00 AM',
    hour: 24
  });
  return slots;
};

const ALL_TIME_SLOTS = generateTimeSlots();

// Mock booked slots - in production this would come from an API
const getBookedSlots = (date) => {
  // For demo purposes, randomly mark some slots as booked based on date
  const dateHash = date.split('-').reduce((a, b) => a + parseInt(b), 0);
  const booked = [];
  ALL_TIME_SLOTS.forEach((slot, index) => {
    if ((dateHash + index) % 4 === 0) {
      booked.push(slot.id);
    }
  });
  return booked;
};

const PAYMENT_METHODS = [
  { id: 'cash', icon: '💵' },
  { id: 'card', icon: '💳' }
];

const BookingWizard = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [booking, setBooking] = useState({
    vehicleType: '',
    vehicleSize: '',
    package: '',
    date: '',
    time: '',
    locationMode: '',
    area: '',
    villa: '',
    street: '',
    instructions: '',
    paymentMethod: '',
    latitude: null,
    longitude: null
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  const totalSteps = 6;

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Set default date to today when wizard opens
  useEffect(() => {
    if (isOpen && !booking.date) {
      const today = getTodayDate();
      setBooking(prev => ({ ...prev, date: today }));
      setBookedSlots(getBookedSlots(today));
      setCurrentHour(new Date().getHours());
    }
  }, [isOpen]);

  // Update booked slots when date changes
  useEffect(() => {
    if (booking.date) {
      setBookedSlots(getBookedSlots(booking.date));
      // Reset time if date changes
      setBooking(prev => ({ ...prev, time: '' }));
    }
  }, [booking.date]);

  // Get available time slots based on current time (for today) and booked slots
  const availableTimeSlots = useMemo(() => {
    const today = getTodayDate();
    const isToday = booking.date === today;

    return ALL_TIME_SLOTS.filter(slot => {
      // Filter out booked slots
      if (bookedSlots.includes(slot.id)) return false;

      // For today, only show future slots (at least 1 hour from now)
      if (isToday && slot.hour <= currentHour) return false;

      return true;
    });
  }, [booking.date, bookedSlots, currentHour]);

  const handleVehicleSelect = (type) => {
    // Reset size when vehicle type changes
    setBooking({ ...booking, vehicleType: type, vehicleSize: '' });
  };

  const handleSizeSelect = (size) => {
    setBooking({ ...booking, vehicleSize: size });
  };

  const handlePackageSelect = (pkg) => {
    if (PACKAGES[pkg].available) {
      setBooking({ ...booking, package: pkg });
    }
  };

  const handleTimeSelect = (time) => {
    setBooking({ ...booking, time });
  };

  const handlePaymentSelect = (method) => {
    setBooking({ ...booking, paymentMethod: method });
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError(t('wizard.locationNotSupported'));
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.address?.city || data.display_name;
          setBooking(prev => ({ ...prev, locationMode: 'auto', area, latitude, longitude }));
          setLocationError('');
        } catch (err) {
          setLocationError(t('wizard.locationFetchError'));
        }
        setIsLocating(false);
      },
      (error) => {
        setLocationError(t('wizard.locationDenied'));
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualLocation = () => {
    setBooking(prev => ({ ...prev, locationMode: 'manual', area: '' }));
    setLocationError('');
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        if (!booking.vehicleType) return false;
        const vehicleConfig = VEHICLE_TYPES.find(v => v.id === booking.vehicleType);
        if (vehicleConfig?.hasSizes) {
          return booking.vehicleSize !== '';
        }
        return true;
      case 2:
        return booking.package !== '';
      case 3:
        return booking.date !== '' && booking.time !== '';
      case 4:
        return booking.area.trim() !== '' && booking.villa.trim() !== '';
      case 5:
        return booking.paymentMethod !== '';
      case 6:
        return true;
      default:
        return false;
    }
  };

  const getPrice = () => {
    if (!booking.package || !booking.vehicleType) return 0;
    const pkg = PACKAGES[booking.package];

    // Check if vehicle needs size
    const vehicleConfig = VEHICLE_TYPES.find(v => v.id === booking.vehicleType);
    if (vehicleConfig?.hasSizes && booking.vehicleSize) {
      const priceKey = `${booking.vehicleType}_${booking.vehicleSize}`;
      return pkg.prices[priceKey] || 0;
    }

    return pkg.prices[booking.vehicleType] || 0;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-AE' : 'en-AE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeLabel = () => {
    const slot = ALL_TIME_SLOTS.find(s => s.id === booking.time);
    return slot ? slot.label : '';
  };

  const getPaymentLabel = () => {
    return booking.paymentMethod === 'cash' ? t('wizard.cash') : t('wizard.cardPayment');
  };

  const getFullLocation = () => {
    const parts = [booking.area];
    if (booking.street) parts.push(booking.street);
    if (booking.villa) parts.push(`Villa/House: ${booking.villa}`);
    return parts.join(', ');
  };

  const generateWhatsAppMessage = () => {
    const packageName = t(`packages.${booking.package}.name`);
    let vehicleType = t(`wizard.${booking.vehicleType}`);
    // Add size for boat/caravan
    if (booking.vehicleSize) {
      const sizeLabel = t(`wizard.${booking.vehicleType}${booking.vehicleSize.charAt(0).toUpperCase() + booking.vehicleSize.slice(1)}`);
      vehicleType += ` (${sizeLabel})`;
    }
    const price = getPrice();
    const dateFormatted = formatDate(booking.date);
    const timeLabel = getTimeLabel();
    const paymentLabel = getPaymentLabel();

    // Generate Google Maps link if coordinates available
    const mapsLink = booking.latitude && booking.longitude
      ? `https://www.google.com/maps?q=${booking.latitude},${booking.longitude}`
      : null;

    if (i18n.language === 'ar') {
      let message = `مرحباً! أود حجز خدمة غسيل سيارات:
- الباقة: ${packageName}
- نوع السيارة: ${vehicleType}
- السعر: ${price} درهم
- التاريخ: ${dateFormatted}
- الوقت: ${timeLabel}
- المنطقة: ${booking.area}`;
      if (booking.street) message += `\n- الشارع: ${booking.street}`;
      message += `\n- الفيلا/المنزل: ${booking.villa}`;
      if (booking.instructions) message += `\n- تعليمات خاصة: ${booking.instructions}`;
      message += `\n- طريقة الدفع: ${paymentLabel}`;
      if (mapsLink) message += `\n- 📍 موقعي على الخريطة: ${mapsLink}`;
      return message;
    }

    let message = `Hi! I'd like to book a car wash service:
- Package: ${packageName}
- Vehicle: ${vehicleType}
- Price: AED ${price}
- Date: ${dateFormatted}
- Time: ${timeLabel}
- Area: ${booking.area}`;
    if (booking.street) message += `\n- Street: ${booking.street}`;
    message += `\n- Villa/House: ${booking.villa}`;
    if (booking.instructions) message += `\n- Special Instructions: ${booking.instructions}`;
    message += `\n- Payment Method: ${paymentLabel}`;
    if (mapsLink) message += `\n- 📍 My Location: ${mapsLink}`;
    return message;
  };

  const handleWhatsAppSubmit = () => {
    const message = generateWhatsAppMessage();
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
    resetWizard();
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setBooking({
      vehicleType: '',
      vehicleSize: '',
      package: '',
      date: '',
      time: '',
      locationMode: '',
      area: '',
      villa: '',
      street: '',
      instructions: '',
      paymentMethod: '',
      latitude: null,
      longitude: null
    });
    setLocationError('');
    setBookedSlots([]);
  };

  const handleClose = () => {
    onClose();
    resetWizard();
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="wizard-overlay" onClick={handleClose}>
      <div className="wizard-container" onClick={(e) => e.stopPropagation()}>
        <button className="wizard-close" onClick={handleClose} aria-label="Close">
          &times;
        </button>

        <div className="wizard-header">
          <h2 className="wizard-title">{t('wizard.title')}</h2>
          <div className="wizard-progress">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div
                key={step}
                className={`progress-step ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
              >
                <div className="step-number">{step}</div>
                <div className="step-label">
                  {t(`wizard.step${step}`)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="wizard-content">
          {/* Step 1: Vehicle Type */}
          {currentStep === 1 && (
            <div className="wizard-step fade-in">
              <h3 className="step-title">{t('wizard.step1')}</h3>
              <div className="vehicle-options">
                {VEHICLE_TYPES.map(({ id, icon }) => (
                  <button
                    key={id}
                    className={`vehicle-card ${booking.vehicleType === id ? 'selected' : ''}`}
                    onClick={() => handleVehicleSelect(id)}
                  >
                    <span className="vehicle-icon">{icon}</span>
                    <span className="vehicle-name">{t(`wizard.${id}`)}</span>
                    <span className="vehicle-desc">{t(`wizard.${id}Desc`)}</span>
                  </button>
                ))}

                {/* Size selection for Boat/Caravan */}
                {booking.vehicleType && VEHICLE_TYPES.find(v => v.id === booking.vehicleType)?.hasSizes && (
                  <div className="vehicle-size-section">
                    <h4 className="size-title">{t('wizard.selectSize')}</h4>
                    <div className="size-options">
                      {VEHICLE_SIZES[booking.vehicleType]?.map(({ id, icon }) => (
                        <button
                          key={id}
                          className={`size-card ${booking.vehicleSize === id ? 'selected' : ''}`}
                          onClick={() => handleSizeSelect(id)}
                        >
                          <span className="size-icon">{icon}</span>
                          <span className="size-name">{t(`wizard.${booking.vehicleType}${id.charAt(0).toUpperCase() + id.slice(1)}`)}</span>
                          <span className="size-desc">{t(`wizard.${booking.vehicleType}${id.charAt(0).toUpperCase() + id.slice(1)}Desc`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Package Selection */}
          {currentStep === 2 && (
            <div className="wizard-step fade-in">
              <h3 className="step-title">{t('wizard.step2')}</h3>
              <div className="package-options">
                {Object.entries(PACKAGES).map(([key, pkg]) => (
                  <button
                    key={key}
                    className={`package-option ${booking.package === key ? 'selected' : ''} ${!pkg.available ? 'disabled' : ''}`}
                    onClick={() => handlePackageSelect(key)}
                    disabled={!pkg.available}
                  >
                    <span className="package-icon">{pkg.icon}</span>
                    <span className="package-name">{t(`packages.${key}.name`)}</span>
                    {pkg.available ? (
                      <span className="package-price">
                        AED {pkg.prices[booking.vehicleType] || 0}
                      </span>
                    ) : (
                      <span className="package-coming-soon">{t('packages.comingSoon')}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {currentStep === 3 && (
            <div className="wizard-step fade-in">
              <h3 className="step-title">{t('wizard.step3')}</h3>
              <div className="datetime-section">
                <label className="input-label">{t('wizard.selectDate')}</label>
                <input
                  type="date"
                  className="date-input"
                  value={booking.date}
                  min={getMinDate()}
                  onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                />
              </div>
              <div className="datetime-section">
                <label className="input-label">{t('wizard.selectTime')}</label>
                <p className="time-slots-info">{t('wizard.availableSlots')}</p>
                <div className="time-slots-vertical">
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        className={`time-slot-btn ${booking.time === slot.id ? 'selected' : ''}`}
                        onClick={() => handleTimeSelect(slot.id)}
                      >
                        <span className="slot-time">{slot.label}</span>
                        <span className="slot-status available">{t('wizard.available')}</span>
                      </button>
                    ))
                  ) : (
                    <p className="no-slots-message">{t('wizard.noSlotsAvailable')}</p>
                  )}
                </div>
                {bookedSlots.length > 0 && (
                  <div className="booked-slots-section">
                    <p className="booked-slots-label">{t('wizard.bookedSlots')}</p>
                    <div className="booked-slots-list">
                      {ALL_TIME_SLOTS.filter(slot => bookedSlots.includes(slot.id)).map((slot) => (
                        <span key={slot.id} className="booked-slot-tag">{slot.label}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Location */}
          {currentStep === 4 && (
            <div className="wizard-step fade-in">
              <h3 className="step-title">{t('wizard.step4')}</h3>

              {/* Location Mode Selection */}
              {!booking.locationMode && (
                <div className="location-mode-options">
                  <button
                    className={`location-mode-btn ${isLocating ? 'loading' : ''}`}
                    onClick={handleGetLocation}
                    disabled={isLocating}
                  >
                    <span className="mode-icon">📍</span>
                    <div className="mode-content">
                      <span className="mode-title">
                        {isLocating ? t('wizard.detecting') : t('wizard.useMyLocation')}
                      </span>
                      <span className="mode-subtitle">{t('wizard.recommended')}</span>
                    </div>
                  </button>
                  <button
                    className="location-mode-btn"
                    onClick={handleManualLocation}
                  >
                    <span className="mode-icon">✏️</span>
                    <div className="mode-content">
                      <span className="mode-title">{t('wizard.enterManually')}</span>
                    </div>
                  </button>
                  {locationError && (
                    <p className="location-error">{locationError}</p>
                  )}
                </div>
              )}

              {/* Location Form (shown after mode selection) */}
              {booking.locationMode && (
                <div className="location-fields">
                  {/* Back to mode selection */}
                  <button
                    className="change-mode-btn"
                    onClick={() => setBooking(prev => ({ ...prev, locationMode: '', area: '' }))}
                  >
                    ← {t('wizard.changeMethod')}
                  </button>

                  {/* Auto-detected area display */}
                  {booking.locationMode === 'auto' && booking.area && (
                    <div className="detected-area">
                      <span className="detected-icon">📍</span>
                      <div className="detected-content">
                        <span className="detected-label">{t('wizard.detectedArea')}</span>
                        <span className="detected-value">{booking.area}</span>
                      </div>
                    </div>
                  )}

                  {/* Manual area input */}
                  {booking.locationMode === 'manual' && (
                    <div className="location-field">
                      <label>
                        {t('wizard.areaNeighborhood')} <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={booking.area}
                        onChange={(e) => setBooking({ ...booking, area: e.target.value })}
                        placeholder={t('wizard.areaPlaceholder')}
                      />
                    </div>
                  )}

                  {/* Villa/House Number */}
                  <div className="location-field">
                    <label>
                      {t('wizard.villaHouse')} <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={booking.villa}
                      onChange={(e) => setBooking({ ...booking, villa: e.target.value })}
                      placeholder={t('wizard.villaPlaceholder')}
                    />
                  </div>

                  {/* Street Name */}
                  <div className="location-field">
                    <label>{t('wizard.streetName')}</label>
                    <input
                      type="text"
                      value={booking.street}
                      onChange={(e) => setBooking({ ...booking, street: e.target.value })}
                      placeholder={t('wizard.streetPlaceholder')}
                    />
                  </div>

                  {/* Special Instructions */}
                  <div className="location-field">
                    <label>{t('wizard.specialInstructions')}</label>
                    <textarea
                      value={booking.instructions}
                      onChange={(e) => setBooking({ ...booking, instructions: e.target.value })}
                      placeholder={t('wizard.instructionsPlaceholder')}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Payment Method */}
          {currentStep === 5 && (
            <div className="wizard-step fade-in">
              <h3 className="step-title">{t('wizard.step5')}</h3>
              <div className="payment-options">
                {PAYMENT_METHODS.map(({ id, icon }) => (
                  <button
                    key={id}
                    className={`payment-option ${booking.paymentMethod === id ? 'selected' : ''}`}
                    onClick={() => handlePaymentSelect(id)}
                  >
                    <span className="payment-icon">{icon}</span>
                    <div className="payment-content">
                      <span className="payment-name">{t(`wizard.${id}`)}</span>
                      <span className="payment-desc">{t(`wizard.${id}Desc`)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Confirmation */}
          {currentStep === 6 && (
            <div className="wizard-step fade-in">
              <h3 className="step-title">{t('wizard.step6')}</h3>
              <div className="summary-section">
                <h4 className="summary-title">{t('wizard.summary')}</h4>
                <div className="summary-items">
                  <div className="summary-item">
                    <span className="summary-label">{t('wizard.step1')}:</span>
                    <span className="summary-value">
                      {t(`wizard.${booking.vehicleType}`)}
                      {booking.vehicleSize && ` (${t(`wizard.${booking.vehicleType}${booking.vehicleSize.charAt(0).toUpperCase() + booking.vehicleSize.slice(1)}`)})`}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{t('wizard.step2')}:</span>
                    <span className="summary-value">{t(`packages.${booking.package}.name`)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{t('wizard.selectDate')}:</span>
                    <span className="summary-value">{formatDate(booking.date)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{t('wizard.selectTime')}:</span>
                    <span className="summary-value">{getTimeLabel()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{t('wizard.areaNeighborhood')}:</span>
                    <span className="summary-value">{booking.area}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{t('wizard.villaHouse')}:</span>
                    <span className="summary-value">{booking.villa}</span>
                  </div>
                  {booking.street && (
                    <div className="summary-item">
                      <span className="summary-label">{t('wizard.streetName')}:</span>
                      <span className="summary-value">{booking.street}</span>
                    </div>
                  )}
                  {booking.instructions && (
                    <div className="summary-item">
                      <span className="summary-label">{t('wizard.specialInstructions')}:</span>
                      <span className="summary-value">{booking.instructions}</span>
                    </div>
                  )}
                  <div className="summary-item">
                    <span className="summary-label">{t('wizard.paymentMethod')}:</span>
                    <span className="summary-value">{getPaymentLabel()}</span>
                  </div>
                  {booking.latitude && booking.longitude && (
                    <div className="summary-item">
                      <span className="summary-label">{t('wizard.mapLocation')}:</span>
                      <span className="summary-value">📍 {t('wizard.locationShared')}</span>
                    </div>
                  )}
                  <div className="summary-item total">
                    <span className="summary-label">{t('wizard.total')}:</span>
                    <span className="summary-value price">AED {getPrice()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          {currentStep > 1 && (
            <button className="wizard-btn btn-back" onClick={handleBack}>
              {t('wizard.back')}
            </button>
          )}
          {currentStep < totalSteps ? (
            <button
              className="wizard-btn btn-next"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {t('wizard.next')}
            </button>
          ) : (
            <button
              className="wizard-btn btn-whatsapp"
              onClick={handleWhatsAppSubmit}
            >
              <svg className="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('wizard.bookNow')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
