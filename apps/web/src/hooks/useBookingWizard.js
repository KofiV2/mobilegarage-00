import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PACKAGES, VEHICLE_TYPES } from '@3on/shared';
import logger from '../utils/logger';

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

export const ALL_TIME_SLOTS = generateTimeSlots();

// Get today's date in YYYY-MM-DD format
export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Initial booking state
const createInitialBooking = () => ({
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

/**
 * Custom hook for BookingWizard state and logic
 * Extracts business logic from the component for better testability and reuse
 */
export const useBookingWizard = ({
  isOpen,
  rescheduleData = null,
  preSelectedPackage = null,
  vehicles = [],
  getDefaultVehicle,
  calculateAddOnsTotal
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSavedVehicle, setSelectedSavedVehicle] = useState(null);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const isReschedule = !!rescheduleData;

  // Consolidated submit-related state
  const [submitState, setSubmitState] = useState({
    isSaving: false,
    submitted: false,
    bookingId: null
  });

  const [booking, setBooking] = useState(createInitialBooking());

  // Consolidated location-related state
  const [locationState, setLocationState] = useState({
    isLocating: false,
    error: ''
  });

  const [bookedSlots, setBookedSlots] = useState([]);
  const [closedSlots, setClosedSlots] = useState({});
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const totalSteps = 6;

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
      const bookedTimes = snapshot.docs.map(docSnap => docSnap.data().time);
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
      fetchBookedSlots(today).then(setBookedSlots);
      fetchClosedSlots().then(setClosedSlots);
    }
  }, [isOpen, booking.date, fetchBookedSlots, fetchClosedSlots]);

  // Auto-select default vehicle when wizard opens
  useEffect(() => {
    if (isOpen && !isReschedule && vehicles.length > 0 && !selectedSavedVehicle && getDefaultVehicle) {
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
  }, [isOpen, isReschedule, vehicles, getDefaultVehicle, selectedSavedVehicle]);

  // Handle reschedule mode
  useEffect(() => {
    if (isOpen && rescheduleData) {
      setBooking(prev => ({
        ...prev,
        vehicleType: rescheduleData.vehicleType || '',
        package: rescheduleData.package || '',
        date: getTodayDate()
      }));
      setCurrentStep(3);
    }
  }, [isOpen, rescheduleData]);

  // Handle preSelectedPackage
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
      setBooking(prev => ({ ...prev, time: '' }));
      fetchBookedSlots(booking.date).then(setBookedSlots);
    }
  }, [booking.date, fetchBookedSlots]);

  // Get available time slots
  const availableTimeSlots = useMemo(() => {
    const today = getTodayDate();
    const isToday = booking.date === today;
    const dateClosedSlots = closedSlots[booking.date] || [];

    return ALL_TIME_SLOTS.filter(slot => {
      if (bookedSlots.includes(slot.id)) return false;
      if (dateClosedSlots.includes(slot.id)) return false;
      if (isToday && slot.hour <= currentHour) return false;
      return true;
    });
  }, [booking.date, bookedSlots, closedSlots, currentHour]);

  // Price calculations
  const getBasePrice = useCallback(() => {
    if (!booking.package || !booking.vehicleType) return 0;
    const pkg = PACKAGES[booking.package];

    const vehicleConfig = VEHICLE_TYPES.find(v => v.id === booking.vehicleType);
    if (vehicleConfig?.hasSizes && booking.vehicleSize) {
      const priceKey = `${booking.vehicleType}_${booking.vehicleSize}`;
      return pkg.prices[priceKey] || 0;
    }

    return pkg.prices[booking.vehicleType] || 0;
  }, [booking.package, booking.vehicleType, booking.vehicleSize]);

  const getPrice = useCallback(() => {
    const basePrice = getBasePrice();
    if (booking.isMonthlySubscription) {
      return Math.round(basePrice * (1 - 0.075));
    }
    return basePrice;
  }, [getBasePrice, booking.isMonthlySubscription]);

  const getAddOnsPrice = useCallback(() => {
    if (!calculateAddOnsTotal) return 0;
    return calculateAddOnsTotal(selectedAddOns);
  }, [calculateAddOnsTotal, selectedAddOns]);

  const getTotalPrice = useCallback(() => {
    return getPrice() + getAddOnsPrice();
  }, [getPrice, getAddOnsPrice]);

  const getMonthlyTotal = useCallback(() => {
    return getPrice() * 4;
  }, [getPrice]);

  // Validation
  const canProceed = useCallback((isGuest = false) => {
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
        if (isGuest) {
          return booking.guestPhone.length === 9 && booking.guestPhone.startsWith('5');
        }
        return true;
      default:
        return false;
    }
  }, [currentStep, booking]);

  // Coordinate validation
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

  // Actions
  const handleVehicleSelect = useCallback((type) => {
    setSelectedSavedVehicle(null);
    setBooking(prev => ({ ...prev, vehicleType: type, vehicleSize: '' }));
  }, []);

  const handleSizeSelect = useCallback((size) => {
    setBooking(prev => ({ ...prev, vehicleSize: size }));
  }, []);

  const handlePackageSelect = useCallback((pkg) => {
    if (!PACKAGES[pkg]) return;
    if (PACKAGES[pkg].available) {
      setBooking(prev => ({ ...prev, package: pkg }));
      if (pkg !== 'platinum') {
        setSelectedAddOns({});
      }
    }
  }, []);

  const handleAddOnChange = useCallback((addonId, value) => {
    setSelectedAddOns(prev => ({
      ...prev,
      [addonId]: value
    }));
  }, []);

  const handleTimeSelect = useCallback((time) => {
    setBooking(prev => ({ ...prev, time }));
  }, []);

  const handlePaymentSelect = useCallback((method) => {
    setBooking(prev => ({ ...prev, paymentMethod: method }));
  }, []);

  const handleDateChange = useCallback((value) => {
    setBooking(prev => ({ ...prev, date: value }));
  }, []);

  const handlePhoneChange = useCallback((digits) => {
    setBooking(prev => ({ ...prev, guestPhone: digits }));
    if (submitAttempted) setSubmitAttempted(false);
  }, [submitAttempted]);

  const handlePhoneBlur = useCallback(() => {
    setPhoneTouched(true);
  }, []);

  const handleToggleSubscription = useCallback(() => {
    setBooking(prev => ({ ...prev, isMonthlySubscription: !prev.isMonthlySubscription }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSavedVehicleSelect = useCallback((vehicle) => {
    setSelectedSavedVehicle(vehicle);
    setBooking(prev => ({
      ...prev,
      vehicleType: vehicle.type,
      vehicleSize: vehicle.size || ''
    }));
    setShowManualSelection(false);
  }, []);

  const handleSkipSavedVehicles = useCallback(() => {
    setSelectedSavedVehicle(null);
    setShowManualSelection(true);
    setBooking(prev => ({ ...prev, vehicleType: '', vehicleSize: '' }));
  }, []);

  const handleBackToSaved = useCallback(() => {
    setShowManualSelection(false);
    if (getDefaultVehicle) {
      const defaultVehicle = getDefaultVehicle();
      if (defaultVehicle) {
        handleSavedVehicleSelect(defaultVehicle);
      }
    }
  }, [getDefaultVehicle, handleSavedVehicleSelect]);

  const handleLocationFieldChange = useCallback((field, value) => {
    setBooking(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleManualLocation = useCallback(() => {
    setBooking(prev => ({ ...prev, locationMode: 'manual', area: '' }));
    setLocationState(prev => ({ ...prev, error: '' }));
  }, []);

  const handleChangeMethod = useCallback(() => {
    setBooking(prev => ({ ...prev, locationMode: '', area: '' }));
  }, []);

  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setBooking(createInitialBooking());
    setLocationState({ isLocating: false, error: '' });
    setBookedSlots([]);
    setSelectedAddOns({});
    setPhoneTouched(false);
    setSubmitAttempted(false);
    setSelectedSavedVehicle(null);
    setShowManualSelection(false);
    setSubmitState({ isSaving: false, submitted: false, bookingId: null });
  }, []);

  const setIsSaving = useCallback((value) => {
    setSubmitState(prev => ({ ...prev, isSaving: value }));
  }, []);

  const setSubmitted = useCallback((bookingId) => {
    setSubmitState({ isSaving: false, submitted: true, bookingId });
  }, []);

  const setLocationError = useCallback((error) => {
    setLocationState(prev => ({ ...prev, error, isLocating: false }));
  }, []);

  const setIsLocating = useCallback((value) => {
    setLocationState(prev => ({ ...prev, isLocating: value, error: value ? '' : prev.error }));
  }, []);

  const updateBookingLocation = useCallback((locationData) => {
    setBooking(prev => ({ ...prev, ...locationData }));
    setLocationState({ isLocating: false, error: '' });
  }, []);

  return {
    // State
    currentStep,
    booking,
    selectedSavedVehicle,
    showManualSelection,
    selectedAddOns,
    submitState,
    locationState,
    bookedSlots,
    availableTimeSlots,
    phoneTouched,
    submitAttempted,
    isReschedule,
    totalSteps,
    
    // Computed
    getBasePrice,
    getPrice,
    getAddOnsPrice,
    getTotalPrice,
    getMonthlyTotal,
    canProceed,
    isValidCoordinate,
    
    // Actions
    handleVehicleSelect,
    handleSizeSelect,
    handlePackageSelect,
    handleAddOnChange,
    handleTimeSelect,
    handlePaymentSelect,
    handleDateChange,
    handlePhoneChange,
    handlePhoneBlur,
    handleToggleSubscription,
    handleNext,
    handleBack,
    handleSavedVehicleSelect,
    handleSkipSavedVehicles,
    handleBackToSaved,
    handleLocationFieldChange,
    handleManualLocation,
    handleChangeMethod,
    resetWizard,
    setIsSaving,
    setSubmitted,
    setLocationError,
    setIsLocating,
    updateBookingLocation,
    setSubmitAttempted,
    
    // Constants
    ALL_TIME_SLOTS
  };
};

export default useBookingWizard;
