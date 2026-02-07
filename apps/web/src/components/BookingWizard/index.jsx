import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { collection, serverTimestamp, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useVehicles } from '../../hooks/useVehicles';
import { useToast } from '../Toast';
import { useConfirm } from '../ConfirmDialog';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useWizardKeyboardNav } from '../../hooks/useKeyboardShortcuts';
import { PACKAGES, VEHICLE_TYPES } from '../../config/packages';
import logger from '../../utils/logger';
import { trackPurchaseConversion } from '../../utils/analytics';
import useAddOns from '../../hooks/useAddOns';
import { checkDuplicateBooking, formatDuplicateMessage } from '../../utils/duplicateBookingCheck';
import { getUserFriendlyError, isRetryableError } from '../../utils/errorRecovery';
import '../BookingWizard.css';

import VehicleStep from './VehicleStep';
import PackageStep from './PackageStep';
import DateTimeStep from './DateTimeStep';
import LocationStep from './LocationStep';
import PaymentStep from './PaymentStep';
import ConfirmationStep from './ConfirmationStep';

// Lazy load SuccessScreen - it imports BookingReceipt which imports pdfGenerator (jsPDF + html2canvas + dompurify)
// This splits ~360KB of dependencies into a separate chunk loaded only after booking success
const SuccessScreen = React.lazy(() => import('./SuccessScreen'));

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

const BookingWizard = ({ isOpen, onClose, rescheduleData = null, preSelectedPackage = null, useFreeWash = false }) => {
  const { t, i18n } = useTranslation();
  const { user, isGuest, getGuestSessionId } = useAuth();
  const { vehicles, getDefaultVehicle } = useVehicles();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const { addOns, getEnabledAddOns, calculateAddOnsTotal } = useAddOns();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSavedVehicle, setSelectedSavedVehicle] = useState(null);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const isReschedule = !!rescheduleData;

  // Consolidated submit-related state (reduces re-renders)
  const [submitState, setSubmitState] = useState({
    isSaving: false,
    submitted: false,
    bookingId: null,
    submitError: null,
    retryCount: 0
  });
  
  // Max retry attempts for booking submission
  const MAX_RETRY_ATTEMPTS = 3;

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
  const [submitAttempted, setSubmitAttempted] = useState(false);

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

  // Handle preSelectedPackage - pre-fill package when coming from Services page
  useEffect(() => {
    if (isOpen && preSelectedPackage && !rescheduleData) {
      setBooking(prev => ({
        ...prev,
        package: preSelectedPackage
      }));
    }
  }, [isOpen, preSelectedPackage, rescheduleData]);

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
    setSelectedSavedVehicle(null);
    // Reset size when vehicle type changes
    setBooking({ ...booking, vehicleType: type, vehicleSize: '' });
  };

  const handleSizeSelect = (size) => {
    setBooking({ ...booking, vehicleSize: size });
  };

  const handlePackageSelect = (pkg) => {
    if (PACKAGES[pkg].available) {
      setBooking({ ...booking, package: pkg });
      // Reset add-ons when package changes (add-ons only for platinum)
      if (pkg !== 'platinum') {
        setSelectedAddOns({});
      }
    }
  };

  const handleAddOnChange = (addonId, value) => {
    setSelectedAddOns(prev => ({
      ...prev,
      [addonId]: value
    }));
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

  const handleChangeMethod = () => {
    setBooking(prev => ({ ...prev, locationMode: '', area: '' }));
  };

  const handleLocationFieldChange = (field, value) => {
    setBooking(prev => ({ ...prev, [field]: value }));
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
    // Free wash = 0 price for base service
    if (useFreeWash) {
      return 0;
    }
    const basePrice = getBasePrice();
    let price = basePrice;
    if (booking.isMonthlySubscription) {
      // 7.5% discount for monthly subscription (4 washes/month)
      price = Math.round(basePrice * (1 - 0.075));
    }
    return price;
  };

  // Get add-ons total (separate from base price for clarity)
  const getAddOnsPrice = () => {
    return calculateAddOnsTotal(selectedAddOns);
  };

  // Get total price including add-ons (add-ons still apply even with free wash)
  const getTotalPrice = () => {
    return getPrice() + getAddOnsPrice();
  };

  // Get original price before free wash (for showing savings)
  const getOriginalPrice = () => {
    const basePrice = getBasePrice();
    if (booking.isMonthlySubscription) {
      return Math.round(basePrice * (1 - 0.075));
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

  const handlePhoneChange = (digits) => {
    setBooking({ ...booking, guestPhone: digits });
    if (submitAttempted) setSubmitAttempted(false);
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
  };

  const handleToggleSubscription = () => {
    setBooking(prev => ({ ...prev, isMonthlySubscription: !prev.isMonthlySubscription }));
  };

  const handleBackToSaved = () => {
    setShowManualSelection(false);
    // Re-select default vehicle if exists
    const defaultVehicle = getDefaultVehicle();
    if (defaultVehicle) {
      handleSavedVehicleSelect(defaultVehicle);
    }
  };

  const handleDateChange = (value) => {
    setBooking({ ...booking, date: value });
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      if (isGuest) {
        setPhoneTouched(true);
        setSubmitAttempted(true);
      }
      return;
    }

    // Check for duplicate bookings (skip for reschedule)
    if (!isReschedule) {
      const duplicateResult = await checkDuplicateBooking({
        userId: user?.uid,
        guestSessionId: isGuest ? getGuestSessionId() : null,
        guestPhone: isGuest ? booking.guestPhone : null,
        vehicleType: booking.vehicleType,
        vehicleSize: booking.vehicleSize,
        date: booking.date,
        time: booking.time,
      });

      if (duplicateResult.hasDuplicate) {
        const { title, message } = formatDuplicateMessage(
          duplicateResult.duplicateType,
          duplicateResult.existingBooking,
          t
        );

        const shouldProceed = await confirm({
          title,
          message,
          confirmText: t('duplicateCheck.proceed', 'Create Anyway'),
          cancelText: t('duplicateCheck.cancel', 'Cancel'),
          variant: 'warning'
        });

        if (!shouldProceed) {
          return;
        }
      }
    }

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
        // Create booking via server-side Cloud Function (price calculated server-side)
        const enabledAddOns = booking.package === 'platinum'
          ? Object.entries(selectedAddOns)
              .filter(([, addon]) => addon.enabled)
              .map(([id, addon]) => ({
                id,
                price: addon.price || 0,
                enabled: true,
                customAmount: addon.customAmount,
              }))
          : [];

        const createBookingFn = httpsCallable(functions, 'createBooking');
        const result = await createBookingFn({
          vehicleType: booking.vehicleType,
          vehicleSize: booking.vehicleSize || undefined,
          packageId: booking.package,
          addOns: enabledAddOns,
          date: booking.date,
          timeSlot: booking.time,
          location: {
            area: booking.area,
            villa: booking.villa,
            street: booking.street || undefined,
            instructions: booking.instructions || undefined,
            latitude: booking.latitude || undefined,
            longitude: booking.longitude || undefined,
          },
          paymentMethod: booking.paymentMethod,
          isMonthlySubscription: booking.isMonthlySubscription || false,
          useFreeWash: useFreeWash || false,
          ...(isGuest && booking.guestPhone && { guestPhone: `+971${booking.guestPhone}` }),
        });

        bookingId = result.data.bookingId.slice(-6).toUpperCase();
      }

      // Track Google Ads conversion (only for new bookings, not reschedules)
      if (!isReschedule) {
        const price = getPrice();
        const isNewUser = user?.createdAt && (Date.now() - new Date(user.createdAt).getTime() < 24 * 60 * 60 * 1000);
        trackPurchaseConversion(bookingId, price, isNewUser);
      }

      // Show success toast
      showToast(
        isReschedule 
          ? (t('wizard.rescheduleSuccess') || 'Booking rescheduled successfully!')
          : (t('wizard.bookingSuccess') || 'Booking confirmed! 🎉'),
        'success'
      );

      // Show success screen - booking saved to Firestore, Telegram notification will be sent automatically
      setSubmitState({ isSaving: false, submitted: true, bookingId, submitError: null, retryCount: 0 });
    } catch (error) {
      logger.error('Error saving booking', error, { isReschedule, retryCount: submitState.retryCount });
      
      // Get user-friendly error message
      const friendlyError = getUserFriendlyError(error);
      const canRetry = isRetryableError(error) && submitState.retryCount < MAX_RETRY_ATTEMPTS;
      
      // Show error state with retry info
      setSubmitState(prev => ({ 
        ...prev, 
        isSaving: false, 
        submitted: false, 
        bookingId: null,
        submitError: friendlyError,
        retryCount: prev.retryCount + 1
      }));
      
      // Show error toast with context
      if (canRetry) {
        showToast(
          `${friendlyError} ${t('wizard.tapRetry') || 'Tap "Book Now" to retry.'}`,
          'error',
          8000
        );
      } else if (submitState.retryCount >= MAX_RETRY_ATTEMPTS) {
        showToast(
          t('wizard.maxRetriesReached') || 'Unable to complete booking. Please try again later or contact support.',
          'error',
          10000
        );
      } else {
        showToast(friendlyError, 'error', 8000);
      }
    }
    // Don't close wizard immediately - let user click "Done" button
  };
  
  // Clear error state when user makes changes
  const clearSubmitError = useCallback(() => {
    if (submitState.submitError) {
      setSubmitState(prev => ({ ...prev, submitError: null }));
    }
  }, [submitState.submitError]);

  const handleCloseSuccess = () => {
    setSubmitState({ isSaving: false, submitted: false, bookingId: null, submitError: null, retryCount: 0 });
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
    setSelectedAddOns({});
    setPhoneTouched(false);
    setSubmitAttempted(false);
  };

  const handleClose = () => {
    onClose();
    resetWizard();
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSignIn = () => {
    handleCloseSuccess();
    navigate('/auth');
  };

  // Focus trap for modal accessibility
  const wizardRef = useFocusTrap(isOpen && !bookingSubmitted, {
    autoFocus: true,
    restoreFocus: true
  });

  // Handle escape key to close (handled by global KeyboardShortcutsContext now)
  // Keeping this as fallback for standalone wizard usage
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Arrow key navigation for wizard steps
  useWizardKeyboardNav({
    isOpen: isOpen && !bookingSubmitted,
    currentStep,
    totalSteps,
    onNext: handleNext,
    onBack: handleBack,
    canProceed
  });

  if (!isOpen) return null;

  // Show success screen after booking submitted
  if (bookingSubmitted) {
    return (
      <Suspense fallback={
        <div className="wizard-overlay" role="presentation">
          <div className="wizard-container success-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <div className="loading-spinner" aria-label="Loading confirmation...">✓</div>
          </div>
        </div>
      }>
        <SuccessScreen
          booking={booking}
          savedBookingId={savedBookingId}
          isReschedule={isReschedule}
          isGuest={isGuest}
          selectedAddOns={selectedAddOns}
          getPrice={getPrice}
          getAddOnsPrice={getAddOnsPrice}
          getTotalPrice={getTotalPrice}
          onClose={handleCloseSuccess}
          onSignIn={handleSignIn}
        />
      </Suspense>
    );
  }

  return (
    <div 
      className="wizard-overlay" 
      onClick={handleClose}
      role="presentation"
      aria-hidden="true"
    >
      <div 
        ref={wizardRef}
        className="wizard-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        aria-describedby="wizard-progress-status"
      >
        <button className="wizard-close" onClick={handleClose} aria-label={t('common.close') || 'Close wizard'}>
          <span aria-hidden="true">&times;</span>
        </button>

        <div className="wizard-header">
          <h2 id="wizard-title" className="wizard-title">
            {isReschedule ? t('wizard.rescheduleTitle') : t('wizard.title')}
          </h2>
          
          {/* Screen reader announcement for step changes */}
          <div 
            id="wizard-progress-status"
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            className="sr-only"
          >
            {t('wizard.stepAnnouncement', {
              current: currentStep,
              total: totalSteps,
              stepName: t(`wizard.step${currentStep}`)
            }) || `Step ${currentStep} of ${totalSteps}: ${t(`wizard.step${currentStep}`)}`}
          </div>

          <nav 
            className="wizard-progress"
            role="navigation"
            aria-label={t('wizard.progressNavigation') || 'Booking wizard steps'}
          >
            <ol className="wizard-progress-list">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <li
                  key={step}
                  className={`progress-step ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
                  aria-current={step === currentStep ? 'step' : undefined}
                >
                  <div className="step-number" aria-hidden="true">{step}</div>
                  <div className="step-label">
                    <span className="sr-only">
                      {step < currentStep ? t('wizard.completed') || 'Completed: ' : ''}
                      {step === currentStep ? t('wizard.current') || 'Current: ' : ''}
                    </span>
                    {t(`wizard.step${step}`)}
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="wizard-content">
          {/* Step 1: Vehicle Type */}
          {currentStep === 1 && (
            <VehicleStep
              booking={booking}
              isGuest={isGuest}
              vehicles={vehicles}
              selectedSavedVehicle={selectedSavedVehicle}
              showManualSelection={showManualSelection}
              onSavedVehicleSelect={handleSavedVehicleSelect}
              onSkipSavedVehicles={handleSkipSavedVehicles}
              onVehicleSelect={handleVehicleSelect}
              onSizeSelect={handleSizeSelect}
              onBackToSaved={handleBackToSaved}
            />
          )}

          {/* Step 2: Package Selection */}
          {currentStep === 2 && (
            <PackageStep
              booking={booking}
              onPackageSelect={handlePackageSelect}
              onToggleSubscription={handleToggleSubscription}
              getBasePrice={getBasePrice}
              getPrice={getPrice}
              getMonthlyTotal={getMonthlyTotal}
              enabledAddOns={getEnabledAddOns()}
              selectedAddOns={selectedAddOns}
              onAddOnChange={handleAddOnChange}
            />
          )}

          {/* Step 3: Date & Time */}
          {currentStep === 3 && (
            <DateTimeStep
              booking={booking}
              availableTimeSlots={availableTimeSlots}
              bookedSlots={bookedSlots}
              allTimeSlots={ALL_TIME_SLOTS}
              getMinDate={getMinDate}
              onDateChange={handleDateChange}
              onTimeSelect={handleTimeSelect}
            />
          )}

          {/* Step 4: Location */}
          {currentStep === 4 && (
            <LocationStep
              booking={booking}
              isLocating={isLocating}
              locationError={locationError}
              onGetLocation={handleGetLocation}
              onManualLocation={handleManualLocation}
              onChangeMethod={handleChangeMethod}
              onFieldChange={handleLocationFieldChange}
            />
          )}

          {/* Step 5: Payment Method */}
          {currentStep === 5 && (
            <PaymentStep
              booking={booking}
              onPaymentSelect={handlePaymentSelect}
            />
          )}

          {/* Step 6: Confirmation */}
          {currentStep === 6 && (
            <ConfirmationStep
              booking={booking}
              isGuest={isGuest}
              phoneTouched={phoneTouched}
              submitAttempted={submitAttempted}
              onPhoneChange={handlePhoneChange}
              onPhoneBlur={handlePhoneBlur}
              formatDate={formatDate}
              getTimeLabel={getTimeLabel}
              getPaymentLabel={getPaymentLabel}
              getPrice={getPrice}
              getAddOnsPrice={getAddOnsPrice}
              getTotalPrice={getTotalPrice}
              getMonthlyTotal={getMonthlyTotal}
              selectedAddOns={selectedAddOns}
              addOns={addOns}
              useFreeWash={useFreeWash}
              getOriginalPrice={getOriginalPrice}
            />
          )}
        </div>

        <div className="wizard-footer" role="group" aria-label={t('wizard.navigation') || 'Wizard navigation'}>
          {currentStep > 1 && (
            <button 
              className="wizard-btn btn-back" 
              onClick={handleBack}
              aria-label={t('wizard.backToStep', { step: t(`wizard.step${currentStep - 1}`) }) || `Go back to step ${currentStep - 1}`}
            >
              <span aria-hidden="true">←</span> {t('wizard.back')}
            </button>
          )}
          {currentStep < totalSteps ? (
            <button
              className="wizard-btn btn-next"
              onClick={handleNext}
              disabled={!canProceed()}
              aria-label={t('wizard.nextToStep', { step: t(`wizard.step${currentStep + 1}`) }) || `Continue to step ${currentStep + 1}`}
              aria-disabled={!canProceed()}
            >
              {t('wizard.next')} <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              className="wizard-btn btn-primary"
              onClick={handleSubmit}
              disabled={isSaving || !canProceed()}
              aria-busy={isSaving}
              aria-disabled={isSaving || !canProceed()}
            >
              {isSaving ? (
                <>
                  <span className="spinner-small" aria-hidden="true"></span>
                  <span className="sr-only">{t('wizard.submitting') || 'Submitting booking'}</span>
                  <span aria-hidden="true">{t('common.loading')}</span>
                </>
              ) : (
                t('wizard.bookNow')
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
  }),
  preSelectedPackage: PropTypes.string,
  useFreeWash: PropTypes.bool
};

export default BookingWizard;
