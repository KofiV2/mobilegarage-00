import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useVehicles } from '../hooks/useVehicles';
import { useToast } from './Toast';
import SavedVehicleSelector from './SavedVehicleSelector';
import { PACKAGES, VEHICLE_TYPES, VEHICLE_SIZES } from '../config/packages';
import logger from '../utils/logger';
import { trackPurchaseConversion } from '../utils/analytics';
import BookingReceipt from './BookingReceipt';
import './BookingWizard.css';

// WhatsApp number removed - bookings now go directly to dashboard + Telegram

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

const PAYMENT_METHODS = [
  { id: 'cash', icon: '💵' },
  { id: 'card', icon: '💳' }
];

const BookingWizard = ({ isOpen, onClose, rescheduleData = null }) => {
  const { t, i18n } = useTranslation();
  const { user, isGuest } = useAuth();
  const { vehicles, getDefaultVehicle } = useVehicles();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSavedVehicle, setSelectedSavedVehicle] = useState(null);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const isReschedule = !!rescheduleData;

  // Consolidated submit-related state (reduces re-renders)
  const [submitState, setSubmitState] = useState({
    isSaving: false,
    submitted: false,
    bookingId: null
  });

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
    longitude: null,
    isMonthlySubscription: false,
    guestPhone: ''
  });

  // Consolidated location-related state (reduces re-renders)
  const [locationState, setLocationState] = useState({
    isLocating: false,
    error: ''
  });

  const [bookedSlots, setBookedSlots] = useState([]);
  const [closedSlots, setClosedSlots] = useState({});
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Destructure for easier access (maintains backward compatibility in render)
  const { isSaving, submitted: bookingSubmitted, bookingId: savedBookingId } = submitState;
  const { isLocating, error: locationError } = locationState;

  const totalSteps = 6;

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch booked slots from Firestore for a given date
  const fetchBookedSlots = useCallback(async (date) => {
    if (!db) return [];

    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('date', '==', date),
        where('status', 'in', ['pending', 'confirmed'])
      );
      const snapshot = await getDocs(q);
      const bookedTimes = snapshot.docs.map(doc => doc.data().time);
      return bookedTimes;
    } catch (error) {
      logger.error('Error fetching booked slots', error, { date });
      return [];
    }
  }, []);

  // Fetch closed slots configuration from Firestore
  const fetchClosedSlots = useCallback(async () => {
    if (!db) return {};

    try {
      const configDoc = await getDoc(doc(db, 'config', 'timeSlots'));
      if (configDoc.exists()) {
        return configDoc.data().closedSlots || {};
      }
      return {};
    } catch (error) {
      logger.error('Error fetching closed slots', error);
      return {};
    }
  }, []);

  // Set default date to today when wizard opens
  useEffect(() => {
    if (isOpen && !booking.date) {
      const today = getTodayDate();
      setBooking(prev => ({ ...prev, date: today }));
      setCurrentHour(new Date().getHours());
      // Fetch booked slots for today
      fetchBookedSlots(today).then(setBookedSlots);
      // Fetch closed slots configuration
      fetchClosedSlots().then(setClosedSlots);
    }
  }, [isOpen, fetchBookedSlots, fetchClosedSlots]);

  // Auto-select default vehicle when wizard opens (for authenticated users with saved vehicles)
  useEffect(() => {
    if (isOpen && !isReschedule && vehicles.length > 0 && !selectedSavedVehicle) {
      const defaultVehicle = getDefaultVehicle();
      if (defaultVehicle) {
        setSelectedSavedVehicle(defaultVehicle);
        setBooking(prev => ({
          ...prev,
          vehicleType: defaultVehicle.type,
          vehicleSize: defaultVehicle.size || ''
        }));
        setShowManualSelection(false);
      }
    }
  }, [isOpen, isReschedule, vehicles, getDefaultVehicle]);

  // Handle saved vehicle selection
  const handleSavedVehicleSelect = (vehicle) => {
    setSelectedSavedVehicle(vehicle);
    setBooking(prev => ({
      ...prev,
      vehicleType: vehicle.type,
      vehicleSize: vehicle.size || ''
    }));
    setShowManualSelection(false);
  };

  // Handle skipping saved vehicles to manual selection
  const handleSkipSavedVehicles = () => {
    setSelectedSavedVehicle(null);
    setShowManualSelection(true);
    // Reset vehicle selection
    setBooking(prev => ({ ...prev, vehicleType: '', vehicleSize: '' }));
  };

  // Handle reschedule mode - pre-fill vehicle and package, start at step 3
  useEffect(() => {
    if (isOpen && rescheduleData) {
      setBooking(prev => ({
        ...prev,
        vehicleType: rescheduleData.vehicleType || '',
        package: rescheduleData.package || '',
        date: getTodayDate()
      }));
      // Skip to step 3 (date/time selection) for reschedule
      setCurrentStep(3);
    }
  }, [isOpen, rescheduleData]);

  // Update booked slots when date changes
  useEffect(() => {
    if (booking.date) {
      // Reset time when date changes
      setBooking(prev => ({ ...prev, time: '' }));
      // Fetch booked slots for new date
      fetchBookedSlots(booking.date).then(setBookedSlots);
    }
  }, [booking.date, fetchBookedSlots]);

  // Get available time slots based on current time (for today), booked slots, and closed slots
  const availableTimeSlots = useMemo(() => {
    const today = getTodayDate();
    const isToday = booking.date === today;
    const dateClosedSlots = closedSlots[booking.date] || [];

    return ALL_TIME_SLOTS.filter(slot => {
      // Filter out booked slots
      if (bookedSlots.includes(slot.id)) return false;

      // Filter out closed slots (manager-disabled)
      if (dateClosedSlots.includes(slot.id)) return false;

      // For today, only show future slots (at least 1 hour from now)
      if (isToday && slot.hour <= currentHour) return false;

      return true;
    });
  }, [booking.date, bookedSlots, closedSlots, currentHour]);

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

  // Validate latitude and longitude are within valid ranges
  const isValidCoordinate = (lat, lng) => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  const handleGetLocation = () => {
    setLocationState({ isLocating: true, error: '' });

    if (!navigator.geolocation) {
      setLocationState({ isLocating: false, error: t('wizard.locationNotSupported') });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Validate coordinates before using them
        if (!isValidCoordinate(latitude, longitude)) {
          logger.error('Invalid coordinates received', { latitude, longitude });
          setLocationState({ isLocating: false, error: t('wizard.locationFetchError') });
          return;
        }

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&format=json`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.address?.city || data.display_name;
          setBooking(prev => ({ ...prev, locationMode: 'auto', area, latitude, longitude }));
          setLocationState({ isLocating: false, error: '' });
        } catch (err) {
          logger.error('Error fetching location from Nominatim', err, { latitude, longitude });
          setLocationState({ isLocating: false, error: t('wizard.locationFetchError') });
        }
      },
      (error) => {
        setLocationState({ isLocating: false, error: t('wizard.locationDenied') });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualLocation = () => {
    setBooking(prev => ({ ...prev, locationMode: 'manual', area: '' }));
    setLocationState(prev => ({ ...prev, error: '' }));
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
        // For guests, require valid UAE phone number (9 digits starting with 5)
        if (isGuest) {
          return booking.guestPhone.length === 9 && booking.guestPhone.startsWith('5');
        }
        return true;
      default:
        return false;
    }
  };

  const getBasePrice = () => {
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

  const getPrice = () => {
    const basePrice = getBasePrice();
    if (booking.isMonthlySubscription) {
      // 7.5% discount for monthly subscription (4 washes/month)
      const discountedPrice = basePrice * (1 - 0.075);
      return Math.round(discountedPrice);
    }
    return basePrice;
  };

  const getMonthlyTotal = () => {
    // Monthly total for 4 washes
    return getPrice() * 4;
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

  const handleSubmit = async () => {
    setSubmitState(prev => ({ ...prev, isSaving: true }));

    try {
      let bookingId;

      if (isReschedule && rescheduleData?.bookingId) {
        // Update existing booking
        const bookingRef = doc(db, 'bookings', rescheduleData.bookingId);
        await updateDoc(bookingRef, {
          date: booking.date,
          time: booking.time,
          location: {
            area: booking.area,
            villa: booking.villa,
            street: booking.street || null,
            instructions: booking.instructions || null,
            latitude: booking.latitude || null,
            longitude: booking.longitude || null
          },
          paymentMethod: booking.paymentMethod,
          rescheduledAt: serverTimestamp()
        });
        bookingId = rescheduleData.bookingId.slice(-6).toUpperCase();
      } else {
        // Save new booking to Firestore
        const bookingData = {
          userId: user?.uid || 'guest',
          vehicleType: booking.vehicleType,
          vehicleSize: booking.vehicleSize || null,
          package: booking.package,
          date: booking.date,
          time: booking.time,
          location: {
            area: booking.area,
            villa: booking.villa,
            street: booking.street || null,
            instructions: booking.instructions || null,
            latitude: booking.latitude || null,
            longitude: booking.longitude || null
          },
          paymentMethod: booking.paymentMethod,
          isSubscription: booking.isMonthlySubscription,
          price: getPrice(),
          status: 'pending',
          createdAt: serverTimestamp(),
          // Add guest phone if booking as guest
          ...(isGuest && booking.guestPhone && { guestPhone: `+971${booking.guestPhone}` })
        };

        const docRef = await addDoc(collection(db, 'bookings'), bookingData);
        bookingId = docRef.id.slice(-6).toUpperCase();
      }

      // Track Google Ads conversion (only for new bookings, not reschedules)
      if (!isReschedule) {
        const price = getPrice();
        const isNewUser = user?.createdAt && (Date.now() - new Date(user.createdAt).getTime() < 24 * 60 * 60 * 1000);
        trackPurchaseConversion(bookingId, price, isNewUser);
      }

      // Show success screen - booking saved to Firestore, Telegram notification will be sent automatically
      setSubmitState({ isSaving: false, submitted: true, bookingId });
    } catch (error) {
      logger.error('Error saving booking', error, { isReschedule });
      // Show error state
      setSubmitState({ isSaving: false, submitted: false, bookingId: null });
      // Show error toast to user
      showToast(t('wizard.bookingError') || 'Failed to save booking. Please try again.', 'error');
    }
    // Don't close wizard immediately - let user click "Done" button
  };

  const handleCloseSuccess = () => {
    setSubmitState({ isSaving: false, submitted: false, bookingId: null });
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
      longitude: null,
      isMonthlySubscription: false,
      guestPhone: ''
    });
    setLocationState({ isLocating: false, error: '' });
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

  // Show success screen after booking submitted
  if (bookingSubmitted) {
    const handleSignIn = () => {
      handleCloseSuccess();
      navigate('/auth');
    };

    return (
      <div className="wizard-overlay" onClick={handleCloseSuccess}>
        <div className="wizard-container success-container" onClick={(e) => e.stopPropagation()}>
          <div className="success-content">
            <div className="success-icon">✓</div>
            <h2 className="success-title">
              {isReschedule ? t('wizard.bookingRescheduled') : t('wizard.bookingConfirmed')}
            </h2>
            {savedBookingId && (
              <div className="booking-id">
                <span>{t('wizard.bookingId')}: </span>
                <strong>#{savedBookingId}</strong>
              </div>
            )}

            {/* Booking Summary */}
            <div className="booking-summary-success">
              <div className="summary-row">
                <span>📦 {t('wizard.step2')}:</span>
                <strong>{PACKAGES[booking.package]?.name || booking.package}</strong>
              </div>
              <div className="summary-row">
                <span>🚗 {t('wizard.step1')}:</span>
                <strong>{VEHICLE_TYPES[booking.vehicleType]?.label || booking.vehicleType}</strong>
              </div>
              <div className="summary-row">
                <span>📅 {t('wizard.step3')}:</span>
                <strong>{booking.date} - {booking.time}</strong>
              </div>
              <div className="summary-row">
                <span>📍 {t('wizard.step4')}:</span>
                <strong>{booking.area}{booking.villa ? `, ${booking.villa}` : ''}</strong>
              </div>
              <div className="summary-row">
                <span>💰 {t('wizard.total')}:</span>
                <strong>AED {getPrice()}</strong>
              </div>
            </div>

            <p className="success-message">{t('wizard.bookingSubmitted')}</p>

            {/* Print Receipt */}
            <BookingReceipt
              bookingId={savedBookingId}
              booking={{
                date: booking.date,
                time: booking.time,
                vehicleType: booking.vehicleType,
                vehicleSize: booking.vehicleSize,
                package: booking.package,
                area: booking.area,
                villa: booking.villa,
                paymentMethod: booking.paymentMethod,
                price: getPrice()
              }}
            />

            <button
              className="wizard-btn btn-primary success-button"
              onClick={handleCloseSuccess}
            >
              {t('wizard.done')}
            </button>

            {/* Show sign-in option for guests */}
            {isGuest && (
              <div className="guest-signup-prompt">
                <p>{t('guest.signInPrompt') || 'Sign in to track your bookings'}</p>
                <button
                  className="wizard-btn btn-secondary"
                  onClick={handleSignIn}
                >
                  {t('nav.signIn') || 'Sign In'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-overlay" onClick={handleClose}>
      <div className="wizard-container" onClick={(e) => e.stopPropagation()}>
        <button className="wizard-close" onClick={handleClose} aria-label="Close">
          &times;
        </button>

        <div className="wizard-header">
          <h2 className="wizard-title">
            {isReschedule ? t('wizard.rescheduleTitle') : t('wizard.title')}
          </h2>
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

              {/* Saved Vehicles Selector (for authenticated users with saved vehicles) */}
              {!isGuest && vehicles.length > 0 && !showManualSelection && (
                <SavedVehicleSelector
                  vehicles={vehicles}
                  selectedVehicleId={selectedSavedVehicle?.id}
                  onSelect={handleSavedVehicleSelect}
                  onSkip={handleSkipSavedVehicles}
                  showSkipOption={true}
                />
              )}

              {/* Manual Vehicle Selection (shown if no saved vehicles, guest mode, or user skipped) */}
              {(isGuest || vehicles.length === 0 || showManualSelection) && (
                <>
                  {vehicles.length > 0 && showManualSelection && (
                    <button
                      className="back-to-saved-btn"
                      onClick={() => {
                        setShowManualSelection(false);
                        // Re-select default vehicle if exists
                        const defaultVehicle = getDefaultVehicle();
                        if (defaultVehicle) {
                          handleSavedVehicleSelect(defaultVehicle);
                        }
                      }}
                    >
                      <span className="back-arrow">←</span> {t('vehicles.useSaved')}
                    </button>
                  )}
                  <div className="vehicle-options">
                    {VEHICLE_TYPES.map(({ id, icon }) => (
                      <button
                        key={id}
                        className={`vehicle-card ${booking.vehicleType === id && !selectedSavedVehicle ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedSavedVehicle(null);
                          handleVehicleSelect(id);
                        }}
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
                </>
              )}
            </div>
          )}

          {/* Step 2: Package Selection */}
          {currentStep === 2 && (
            <div className="wizard-step fade-in">
              <h3 className="step-title">{t('wizard.step2')}</h3>

              {/* Monthly Subscription Toggle */}
              <div className="subscription-toggle-section">
                <div
                  className={`subscription-toggle ${booking.isMonthlySubscription ? 'active' : ''}`}
                  onClick={() => setBooking(prev => ({ ...prev, isMonthlySubscription: !prev.isMonthlySubscription }))}
                >
                  <div className="toggle-content">
                    <div className="toggle-header">
                      <span className="toggle-icon">🔄</span>
                      <span className="toggle-title">{t('wizard.monthlySubscription')}</span>
                      <span className="discount-badge">-7.5%</span>
                    </div>
                    <p className="toggle-description">{t('wizard.monthlySubscriptionDesc')}</p>
                  </div>
                  <div className="toggle-switch">
                    <div className="toggle-track">
                      <div className="toggle-thumb"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="package-options">
                {Object.entries(PACKAGES).map(([key, pkg]) => {
                  const basePrice = pkg.prices[booking.vehicleType] || 0;
                  const displayPrice = booking.isMonthlySubscription
                    ? Math.round(basePrice * (1 - 0.075))
                    : basePrice;

                  return (
                    <button
                      key={key}
                      className={`package-option ${booking.package === key ? 'selected' : ''} ${!pkg.available ? 'disabled' : ''}`}
                      onClick={() => handlePackageSelect(key)}
                      disabled={!pkg.available}
                    >
                      <span className="package-icon">{pkg.icon}</span>
                      <span className="package-name">{t(`packages.${key}.name`)}</span>
                      {pkg.available ? (
                        <div className="package-price-container">
                          {booking.isMonthlySubscription && (
                            <span className="package-price-original">AED {basePrice}</span>
                          )}
                          <span className="package-price">
                            AED {displayPrice}
                          </span>
                          {booking.isMonthlySubscription && (
                            <span className="package-price-per">{t('wizard.perWash')}</span>
                          )}
                        </div>
                      ) : (
                        <span className="package-coming-soon">{t('packages.comingSoon')}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {booking.isMonthlySubscription && booking.package && (
                <div className="monthly-summary">
                  <div className="monthly-summary-row">
                    <span>{t('wizard.monthlyTotal')} (4 {t('wizard.washes')}):</span>
                    <span className="monthly-total">AED {getMonthlyTotal()}</span>
                  </div>
                  <div className="monthly-savings">
                    {t('wizard.youSave')} AED {(getBasePrice() * 4) - getMonthlyTotal()} {t('wizard.perMonth')}
                  </div>
                </div>
              )}
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
                    <span className="back-arrow">←</span> {t('wizard.changeMethod')}
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

              {/* Guest Phone Collection */}
              {isGuest && (
                <div className="guest-phone-section">
                  <label className="input-label">{t('guest.phoneLabel')}</label>
                  <p className="phone-help-text">{t('guest.phoneHelp')}</p>
                  <div className={`phone-input-group ${phoneTouched && booking.guestPhone.length > 0 && !booking.guestPhone.startsWith('5') ? 'has-error shake' : ''} ${booking.guestPhone.length === 9 && booking.guestPhone.startsWith('5') ? 'has-success' : ''}`}>
                    <div className="phone-prefix">
                      <span className="uae-flag">🇦🇪</span>
                      <span className="prefix-code">+971</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={`phone-input ${phoneTouched && booking.guestPhone.length > 0 && !booking.guestPhone.startsWith('5') ? 'error' : ''}`}
                      value={booking.guestPhone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setBooking({ ...booking, guestPhone: digits });
                      }}
                      onBlur={() => setPhoneTouched(true)}
                      placeholder="5X XXX XXXX"
                      aria-describedby="phone-error"
                    />
                    {booking.guestPhone.length === 9 && booking.guestPhone.startsWith('5') && (
                      <span className="phone-success-icon" aria-hidden="true">✓</span>
                    )}
                  </div>
                  {phoneTouched && booking.guestPhone.length > 0 && !booking.guestPhone.startsWith('5') && (
                    <p id="phone-error" className="phone-error-text" role="alert">
                      {t('guest.phoneStartsWith5')}
                    </p>
                  )}
                </div>
              )}

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
                  {booking.isMonthlySubscription && (
                    <div className="summary-item subscription-info">
                      <span className="summary-label">{t('wizard.subscriptionType')}:</span>
                      <span className="summary-value subscription-value">
                        🔄 {t('wizard.monthlySubscription')} (-7.5%)
                      </span>
                    </div>
                  )}
                  <div className="summary-item total">
                    <span className="summary-label">
                      {booking.isMonthlySubscription ? t('wizard.pricePerWash') : t('wizard.total')}:
                    </span>
                    <span className="summary-value price">AED {getPrice()}</span>
                  </div>
                  {booking.isMonthlySubscription && (
                    <div className="summary-item monthly-total-row">
                      <span className="summary-label">{t('wizard.monthlyTotal')} (4 {t('wizard.washes')}):</span>
                      <span className="summary-value price monthly">AED {getMonthlyTotal()}</span>
                    </div>
                  )}
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
              className="wizard-btn btn-primary"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-small"></span>
                  {t('common.loading')}
                </>
              ) : (
                <>
                  {t('wizard.bookNow')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

BookingWizard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  rescheduleData: PropTypes.shape({
    bookingId: PropTypes.string,
    vehicleType: PropTypes.string,
    package: PropTypes.string,
    price: PropTypes.number
  })
};

export default BookingWizard;
