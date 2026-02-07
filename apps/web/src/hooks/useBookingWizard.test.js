import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookingWizard, ALL_TIME_SLOTS, getTodayDate } from './useBookingWizard';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
}));

vi.mock('../firebase/config', () => ({
  db: {},
}));

vi.mock('../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock PACKAGES and VEHICLE_TYPES
vi.mock('../config/packages', () => ({
  PACKAGES: {
    platinum: {
      id: 'platinum',
      prices: {
        sedan: 45,
        suv: 50,
        motorcycle: 30,
        caravan_small: 60,
        caravan_medium: 80,
        caravan_large: 120,
      },
      available: true,
    },
    titanium: {
      id: 'titanium',
      prices: {
        sedan: 75,
        suv: 80,
        motorcycle: 50,
      },
      available: true,
      popular: true,
    },
    diamond: {
      id: 'diamond',
      prices: {
        sedan: 110,
        suv: 120,
        motorcycle: null,
      },
      available: true,
    },
    unavailable_pkg: {
      id: 'unavailable_pkg',
      prices: { sedan: 100 },
      available: false,
    },
  },
  VEHICLE_TYPES: [
    { id: 'sedan', icon: '🚗', hasSizes: false },
    { id: 'suv', icon: '🚙', hasSizes: false },
    { id: 'motorcycle', icon: '🏍️', hasSizes: false },
    { id: 'caravan', icon: '🚐', hasSizes: true },
  ],
  VEHICLE_SIZES: {
    caravan: [
      { id: 'small', icon: '🚐' },
      { id: 'medium', icon: '🚐' },
      { id: 'large', icon: '🚐' },
    ],
  },
}));

describe('useBookingWizard', () => {
  const defaultProps = {
    isOpen: true,
    rescheduleData: null,
    preSelectedPackage: null,
    vehicles: [],
    getDefaultVehicle: null,
    calculateAddOnsTotal: vi.fn(() => 0),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', async () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      await waitFor(() => {
        expect(result.current.currentStep).toBe(1);
        expect(result.current.booking.vehicleType).toBe('');
        expect(result.current.booking.vehicleSize).toBe('');
        expect(result.current.booking.package).toBe('');
        expect(result.current.booking.date).toBe(getTodayDate()); // Today
        expect(result.current.booking.time).toBe('');
        expect(result.current.booking.locationMode).toBe('');
        expect(result.current.booking.area).toBe('');
        expect(result.current.booking.villa).toBe('');
        expect(result.current.booking.paymentMethod).toBe('');
        expect(result.current.booking.isMonthlySubscription).toBe(false);
        expect(result.current.booking.guestPhone).toBe('');
        expect(result.current.totalSteps).toBe(6);
        expect(result.current.isReschedule).toBe(false);
      });
    });

    it('should set selectedSavedVehicle to null initially', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      expect(result.current.selectedSavedVehicle).toBe(null);
      expect(result.current.showManualSelection).toBe(false);
    });

    it('should initialize submitState correctly', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      expect(result.current.submitState).toEqual({
        isSaving: false,
        submitted: false,
        bookingId: null,
      });
    });

    it('should initialize locationState correctly', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      expect(result.current.locationState).toEqual({
        isLocating: false,
        error: '',
      });
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to next step with handleNext', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      expect(result.current.currentStep).toBe(1);

      act(() => {
        result.current.handleNext();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should navigate to previous step with handleBack', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleNext();
        result.current.handleNext();
      });
      expect(result.current.currentStep).toBe(3);

      act(() => {
        result.current.handleBack();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should not go below step 1', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      expect(result.current.currentStep).toBe(1);

      act(() => {
        result.current.handleBack();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should not exceed total steps', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      // Go to last step
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.handleNext();
        });
      }

      expect(result.current.currentStep).toBe(6);
    });
  });

  describe('Vehicle Selection and Size Handling', () => {
    it('should select vehicle type', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
      });

      expect(result.current.booking.vehicleType).toBe('sedan');
      expect(result.current.booking.vehicleSize).toBe('');
    });

    it('should clear vehicleSize when changing vehicle type', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('caravan');
        result.current.handleSizeSelect('medium');
      });

      expect(result.current.booking.vehicleType).toBe('caravan');
      expect(result.current.booking.vehicleSize).toBe('medium');

      act(() => {
        result.current.handleVehicleSelect('sedan');
      });

      expect(result.current.booking.vehicleType).toBe('sedan');
      expect(result.current.booking.vehicleSize).toBe('');
    });

    it('should select vehicle size for vehicles with sizes', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('caravan');
        result.current.handleSizeSelect('large');
      });

      expect(result.current.booking.vehicleType).toBe('caravan');
      expect(result.current.booking.vehicleSize).toBe('large');
    });

    it('should clear selectedSavedVehicle when manually selecting vehicle', async () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      // First, manually set a saved vehicle
      act(() => {
        result.current.handleSavedVehicleSelect({ type: 'suv', size: '' });
      });

      await waitFor(() => {
        expect(result.current.selectedSavedVehicle).toEqual({ type: 'suv', size: '' });
      });

      // Now select a different vehicle manually
      act(() => {
        result.current.handleVehicleSelect('motorcycle');
      });

      await waitFor(() => {
        expect(result.current.selectedSavedVehicle).toBe(null);
        expect(result.current.booking.vehicleType).toBe('motorcycle');
      });
    });
  });

  describe('Package Selection', () => {
    it('should select an available package', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handlePackageSelect('titanium');
      });

      expect(result.current.booking.package).toBe('titanium');
    });

    it('should not select an unavailable package', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handlePackageSelect('unavailable_pkg');
      });

      expect(result.current.booking.package).toBe('');
    });

    it('should clear add-ons when switching away from platinum', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handlePackageSelect('platinum');
        result.current.handleAddOnChange('tip', 10);
        result.current.handleAddOnChange('wax', true);
      });

      expect(result.current.selectedAddOns).toEqual({ tip: 10, wax: true });

      act(() => {
        result.current.handlePackageSelect('titanium');
      });

      expect(result.current.booking.package).toBe('titanium');
      expect(result.current.selectedAddOns).toEqual({});
    });

    it('should keep add-ons when switching to another platinum selection', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handlePackageSelect('platinum');
        result.current.handleAddOnChange('tip', 20);
      });

      expect(result.current.selectedAddOns).toEqual({ tip: 20 });

      // Re-select platinum (no change)
      act(() => {
        result.current.handlePackageSelect('platinum');
      });

      expect(result.current.selectedAddOns).toEqual({ tip: 20 });
    });

    it('should use preSelectedPackage when provided', async () => {
      const props = {
        ...defaultProps,
        preSelectedPackage: 'diamond',
      };

      const { result } = renderHook(() => useBookingWizard(props));

      await waitFor(() => {
        expect(result.current.booking.package).toBe('diamond');
      });
    });
  });

  describe('Time Slot Filtering', () => {
    it('should generate all time slots from 12 PM to 12 AM', () => {
      expect(ALL_TIME_SLOTS.length).toBe(13); // 12 PM to 12 AM (12, 13, ...23, 24)
      expect(ALL_TIME_SLOTS[0].id).toBe('12:00');
      expect(ALL_TIME_SLOTS[0].label).toBe('12:00 PM');
      expect(ALL_TIME_SLOTS[ALL_TIME_SLOTS.length - 1].id).toBe('24:00');
      expect(ALL_TIME_SLOTS[ALL_TIME_SLOTS.length - 1].label).toBe('12:00 AM');
    });

    it('should return available time slots', async () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      await waitFor(() => {
        // Should return some array of available slots
        expect(Array.isArray(result.current.availableTimeSlots)).toBe(true);
      });
    });

    it('should show all slots for future dates', async () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      // Set a future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      act(() => {
        result.current.handleDateChange(tomorrowStr);
      });

      await waitFor(() => {
        // For future dates, all slots should be available (no past hour filtering)
        expect(result.current.availableTimeSlots.length).toBe(13);
      });
    });
  });

  describe('Price Calculations', () => {
    it('should return 0 when no package or vehicle selected', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      expect(result.current.getBasePrice()).toBe(0);
      expect(result.current.getPrice()).toBe(0);
      expect(result.current.getTotalPrice()).toBe(0);
    });

    it('should calculate base price for sedan', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handlePackageSelect('platinum');
      });

      expect(result.current.getBasePrice()).toBe(45);
      expect(result.current.getPrice()).toBe(45);
    });

    it('should calculate base price for SUV', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('suv');
        result.current.handlePackageSelect('titanium');
      });

      expect(result.current.getBasePrice()).toBe(80);
    });

    it('should calculate price with size for caravan', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('caravan');
        result.current.handleSizeSelect('medium');
        result.current.handlePackageSelect('platinum');
      });

      expect(result.current.getBasePrice()).toBe(80);
    });

    it('should apply subscription discount (7.5%)', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handlePackageSelect('platinum');
      });

      expect(result.current.getPrice()).toBe(45);

      act(() => {
        result.current.handleToggleSubscription();
      });

      // 45 * (1 - 0.075) = 45 * 0.925 = 41.625, rounded to 42
      expect(result.current.getPrice()).toBe(42);
      expect(result.current.booking.isMonthlySubscription).toBe(true);
    });

    it('should calculate monthly total (4x weekly price)', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handlePackageSelect('platinum');
        result.current.handleToggleSubscription();
      });

      // 42 * 4 = 168
      expect(result.current.getMonthlyTotal()).toBe(168);
    });

    it('should include add-ons in total price', () => {
      const calculateAddOnsTotal = vi.fn(() => 35);
      const props = { ...defaultProps, calculateAddOnsTotal };

      const { result } = renderHook(() => useBookingWizard(props));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handlePackageSelect('platinum');
      });

      expect(result.current.getAddOnsPrice()).toBe(35);
      expect(result.current.getTotalPrice()).toBe(45 + 35);
    });

    it('should include add-ons with subscription price', () => {
      const calculateAddOnsTotal = vi.fn(() => 25);
      const props = { ...defaultProps, calculateAddOnsTotal };

      const { result } = renderHook(() => useBookingWizard(props));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handlePackageSelect('platinum');
        result.current.handleToggleSubscription();
      });

      // Base: 42 (with 7.5% discount), Add-ons: 25, Total: 67
      expect(result.current.getTotalPrice()).toBe(42 + 25);
    });
  });

  describe('Validation (canProceed)', () => {
    it('should not proceed on step 1 without vehicle type', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      expect(result.current.canProceed()).toBe(false);
    });

    it('should proceed on step 1 with vehicle type (no size required)', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
      });

      expect(result.current.canProceed()).toBe(true);
    });

    it('should not proceed on step 1 with vehicle type requiring size but no size selected', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('caravan');
      });

      expect(result.current.canProceed()).toBe(false);
    });

    it('should proceed on step 1 with vehicle type requiring size and size selected', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('caravan');
        result.current.handleSizeSelect('small');
      });

      expect(result.current.canProceed()).toBe(true);
    });

    it('should not proceed on step 2 without package', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
      });

      expect(result.current.currentStep).toBe(2);
      expect(result.current.canProceed()).toBe(false);
    });

    it('should proceed on step 2 with package selected', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
      });

      expect(result.current.canProceed()).toBe(true);
    });

    it('should not proceed on step 3 without date and time', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      // Navigate to step 3
      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
      });

      // Date is set by default, but time is not
      expect(result.current.currentStep).toBe(3);
      expect(result.current.canProceed()).toBe(false);
    });

    it('should proceed on step 3 with date and time selected', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
        result.current.handleTimeSelect('14:00');
      });

      expect(result.current.currentStep).toBe(3);
      expect(result.current.canProceed()).toBe(true);
    });

    it('should not proceed on step 4 without area and villa', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
        result.current.handleTimeSelect('14:00');
        result.current.handleNext();
      });

      expect(result.current.currentStep).toBe(4);
      expect(result.current.canProceed()).toBe(false);
    });

    it('should proceed on step 4 with area and villa filled', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
        result.current.handleTimeSelect('14:00');
        result.current.handleNext();
        result.current.handleLocationFieldChange('area', 'Al Barsha');
        result.current.handleLocationFieldChange('villa', '123');
      });

      expect(result.current.canProceed()).toBe(true);
    });

    it('should not proceed on step 5 without payment method', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
        result.current.handleTimeSelect('14:00');
        result.current.handleNext();
        result.current.handleLocationFieldChange('area', 'Al Barsha');
        result.current.handleLocationFieldChange('villa', '123');
        result.current.handleNext();
      });

      expect(result.current.currentStep).toBe(5);
      expect(result.current.canProceed()).toBe(false);
    });

    it('should proceed on step 5 with payment method', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
        result.current.handleTimeSelect('14:00');
        result.current.handleNext();
        result.current.handleLocationFieldChange('area', 'Al Barsha');
        result.current.handleLocationFieldChange('villa', '123');
        result.current.handleNext();
        result.current.handlePaymentSelect('cash');
      });

      expect(result.current.canProceed()).toBe(true);
    });
  });

  describe('Guest Phone Validation', () => {
    it('should validate guest phone on step 6 for guests', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      // Navigate to step 6
      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
        result.current.handleTimeSelect('14:00');
        result.current.handleNext();
        result.current.handleLocationFieldChange('area', 'Al Barsha');
        result.current.handleLocationFieldChange('villa', '123');
        result.current.handleNext();
        result.current.handlePaymentSelect('cash');
        result.current.handleNext();
      });

      expect(result.current.currentStep).toBe(6);
      
      // Guest with no phone
      expect(result.current.canProceed(true)).toBe(false);
    });

    it('should accept valid UAE phone starting with 5 and 9 digits', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      // Navigate to step 6
      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
        result.current.handleTimeSelect('14:00');
        result.current.handleNext();
        result.current.handleLocationFieldChange('area', 'Al Barsha');
        result.current.handleLocationFieldChange('villa', '123');
        result.current.handleNext();
        result.current.handlePaymentSelect('cash');
        result.current.handleNext();
        result.current.handlePhoneChange('501234567');
      });

      expect(result.current.canProceed(true)).toBe(true);
    });

    it('should reject phone not starting with 5', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
        result.current.handleTimeSelect('14:00');
        result.current.handleNext();
        result.current.handleLocationFieldChange('area', 'Al Barsha');
        result.current.handleLocationFieldChange('villa', '123');
        result.current.handleNext();
        result.current.handlePaymentSelect('cash');
        result.current.handleNext();
        result.current.handlePhoneChange('401234567');
      });

      expect(result.current.canProceed(true)).toBe(false);
    });

    it('should reject phone with wrong length', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
        result.current.handleTimeSelect('14:00');
        result.current.handleNext();
        result.current.handleLocationFieldChange('area', 'Al Barsha');
        result.current.handleLocationFieldChange('villa', '123');
        result.current.handleNext();
        result.current.handlePaymentSelect('cash');
        result.current.handleNext();
        result.current.handlePhoneChange('5012345'); // Only 7 digits
      });

      expect(result.current.canProceed(true)).toBe(false);
    });

    it('should allow step 6 for authenticated users without phone', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleVehicleSelect('sedan');
        result.current.handleNext();
        result.current.handlePackageSelect('platinum');
        result.current.handleNext();
        result.current.handleTimeSelect('14:00');
        result.current.handleNext();
        result.current.handleLocationFieldChange('area', 'Al Barsha');
        result.current.handleLocationFieldChange('villa', '123');
        result.current.handleNext();
        result.current.handlePaymentSelect('cash');
        result.current.handleNext();
      });

      // isGuest = false (authenticated user)
      expect(result.current.canProceed(false)).toBe(true);
    });

    it('should set phoneTouched on blur', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      expect(result.current.phoneTouched).toBe(false);

      act(() => {
        result.current.handlePhoneBlur();
      });

      expect(result.current.phoneTouched).toBe(true);
    });

    it('should clear submitAttempted when phone changes', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.setSubmitAttempted(true);
      });

      expect(result.current.submitAttempted).toBe(true);

      act(() => {
        result.current.handlePhoneChange('512345678');
      });

      expect(result.current.submitAttempted).toBe(false);
    });
  });

  describe('Location State Management', () => {
    it('should update location fields', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleLocationFieldChange('area', 'Downtown Dubai');
        result.current.handleLocationFieldChange('villa', 'Villa 42');
        result.current.handleLocationFieldChange('street', 'Sheikh Zayed Road');
        result.current.handleLocationFieldChange('instructions', 'Near the mall');
      });

      expect(result.current.booking.area).toBe('Downtown Dubai');
      expect(result.current.booking.villa).toBe('Villa 42');
      expect(result.current.booking.street).toBe('Sheikh Zayed Road');
      expect(result.current.booking.instructions).toBe('Near the mall');
    });

    it('should set location mode to manual', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleManualLocation();
      });

      expect(result.current.booking.locationMode).toBe('manual');
      expect(result.current.booking.area).toBe('');
      expect(result.current.locationState.error).toBe('');
    });

    it('should clear location mode with handleChangeMethod', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleManualLocation();
      });

      expect(result.current.booking.locationMode).toBe('manual');

      act(() => {
        result.current.handleChangeMethod();
      });

      expect(result.current.booking.locationMode).toBe('');
      expect(result.current.booking.area).toBe('');
    });

    it('should set location error', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.setLocationError('Unable to get location');
      });

      expect(result.current.locationState.error).toBe('Unable to get location');
      expect(result.current.locationState.isLocating).toBe(false);
    });

    it('should set isLocating state', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.setIsLocating(true);
      });

      expect(result.current.locationState.isLocating).toBe(true);
      expect(result.current.locationState.error).toBe('');

      act(() => {
        result.current.setIsLocating(false);
      });

      expect(result.current.locationState.isLocating).toBe(false);
    });

    it('should update booking location', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.updateBookingLocation({
          latitude: 25.2048,
          longitude: 55.2708,
          area: 'Dubai',
          locationMode: 'gps',
        });
      });

      expect(result.current.booking.latitude).toBe(25.2048);
      expect(result.current.booking.longitude).toBe(55.2708);
      expect(result.current.booking.area).toBe('Dubai');
      expect(result.current.booking.locationMode).toBe('gps');
      expect(result.current.locationState.isLocating).toBe(false);
      expect(result.current.locationState.error).toBe('');
    });

    it('should validate coordinates correctly', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      expect(result.current.isValidCoordinate(25.2048, 55.2708)).toBe(true);
      expect(result.current.isValidCoordinate(0, 0)).toBe(true);
      expect(result.current.isValidCoordinate(-90, -180)).toBe(true);
      expect(result.current.isValidCoordinate(90, 180)).toBe(true);
      expect(result.current.isValidCoordinate(-91, 0)).toBe(false);
      expect(result.current.isValidCoordinate(91, 0)).toBe(false);
      expect(result.current.isValidCoordinate(0, -181)).toBe(false);
      expect(result.current.isValidCoordinate(0, 181)).toBe(false);
      expect(result.current.isValidCoordinate(NaN, 55)).toBe(false);
      expect(result.current.isValidCoordinate(25, NaN)).toBe(false);
      expect(result.current.isValidCoordinate(null, 55)).toBe(false);
      expect(result.current.isValidCoordinate('25', 55)).toBe(false);
    });
  });

  describe('Reset Wizard Functionality', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      // Make various changes
      act(() => {
        result.current.handleVehicleSelect('suv');
        result.current.handleNext();
        result.current.handlePackageSelect('titanium');
        result.current.handleNext();
        result.current.handleTimeSelect('15:00');
        result.current.handleNext();
        result.current.handleLocationFieldChange('area', 'Marina');
        result.current.handleLocationFieldChange('villa', '55');
        result.current.handleToggleSubscription();
        result.current.handleAddOnChange('tip', 15);
        result.current.setLocationError('Test error');
      });

      // Verify changes
      expect(result.current.currentStep).toBe(4);
      expect(result.current.booking.vehicleType).toBe('suv');
      expect(result.current.booking.package).toBe('titanium');
      expect(result.current.booking.isMonthlySubscription).toBe(true);
      expect(result.current.selectedAddOns).toEqual({ tip: 15 });

      // Reset
      act(() => {
        result.current.resetWizard();
      });

      // Verify reset
      expect(result.current.currentStep).toBe(1);
      expect(result.current.booking.vehicleType).toBe('');
      expect(result.current.booking.vehicleSize).toBe('');
      expect(result.current.booking.package).toBe('');
      expect(result.current.booking.time).toBe('');
      expect(result.current.booking.area).toBe('');
      expect(result.current.booking.villa).toBe('');
      expect(result.current.booking.isMonthlySubscription).toBe(false);
      expect(result.current.booking.paymentMethod).toBe('');
      expect(result.current.booking.guestPhone).toBe('');
      expect(result.current.selectedAddOns).toEqual({});
      expect(result.current.selectedSavedVehicle).toBe(null);
      expect(result.current.showManualSelection).toBe(false);
      expect(result.current.phoneTouched).toBe(false);
      expect(result.current.submitAttempted).toBe(false);
      expect(result.current.locationState).toEqual({ isLocating: false, error: '' });
      expect(result.current.submitState).toEqual({
        isSaving: false,
        submitted: false,
        bookingId: null,
      });
    });

    it('should reset booked slots array', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      // Reset (bookedSlots starts empty anyway, but verify it's cleared)
      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.bookedSlots).toEqual([]);
    });
  });

  describe('Submit State Management', () => {
    it('should set isSaving', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.setIsSaving(true);
      });

      expect(result.current.submitState.isSaving).toBe(true);

      act(() => {
        result.current.setIsSaving(false);
      });

      expect(result.current.submitState.isSaving).toBe(false);
    });

    it('should set submitted with booking ID', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.setSubmitted('booking-123');
      });

      expect(result.current.submitState).toEqual({
        isSaving: false,
        submitted: true,
        bookingId: 'booking-123',
      });
    });
  });

  describe('Saved Vehicle Selection', () => {
    it('should auto-select default vehicle when wizard opens', async () => {
      const mockVehicle = { type: 'sedan', size: '', name: 'My Car' };
      const getDefaultVehicle = vi.fn(() => mockVehicle);
      const props = {
        ...defaultProps,
        vehicles: [mockVehicle],
        getDefaultVehicle,
      };

      const { result } = renderHook(() => useBookingWizard(props));

      await waitFor(() => {
        expect(result.current.selectedSavedVehicle).toEqual(mockVehicle);
        expect(result.current.booking.vehicleType).toBe('sedan');
      });
    });

    it('should handle handleSavedVehicleSelect', () => {
      const mockVehicle = { type: 'suv', size: '', name: 'SUV' };
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleSavedVehicleSelect(mockVehicle);
      });

      expect(result.current.selectedSavedVehicle).toEqual(mockVehicle);
      expect(result.current.booking.vehicleType).toBe('suv');
      expect(result.current.showManualSelection).toBe(false);
    });

    it('should skip saved vehicles and show manual selection', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleSkipSavedVehicles();
      });

      expect(result.current.selectedSavedVehicle).toBe(null);
      expect(result.current.showManualSelection).toBe(true);
      expect(result.current.booking.vehicleType).toBe('');
      expect(result.current.booking.vehicleSize).toBe('');
    });

    it('should go back to saved vehicles', async () => {
      const mockVehicle = { type: 'motorcycle', size: '' };
      const getDefaultVehicle = vi.fn(() => mockVehicle);
      
      // Start with isOpen: false to prevent auto-selection during mount
      const props = {
        ...defaultProps,
        isOpen: false,
        vehicles: [mockVehicle],
        getDefaultVehicle,
      };

      const { result, rerender } = renderHook((p) => useBookingWizard(p), {
        initialProps: props,
      });

      // First, manually set up the state by calling handleSavedVehicleSelect
      act(() => {
        result.current.handleSavedVehicleSelect(mockVehicle);
      });

      expect(result.current.selectedSavedVehicle).toEqual(mockVehicle);
      expect(result.current.showManualSelection).toBe(false);

      // Skip saved vehicles to go to manual mode
      act(() => {
        result.current.handleSkipSavedVehicles();
      });

      // Check that we're now in manual mode
      expect(result.current.showManualSelection).toBe(true);
      expect(result.current.selectedSavedVehicle).toBe(null);

      // Go back to saved vehicles
      act(() => {
        result.current.handleBackToSaved();
      });

      // Should be back to saved mode with the default vehicle selected
      expect(result.current.showManualSelection).toBe(false);
      expect(result.current.selectedSavedVehicle).toEqual(mockVehicle);
    });
  });

  describe('Reschedule Mode', () => {
    it('should initialize in reschedule mode with existing data', async () => {
      const props = {
        ...defaultProps,
        rescheduleData: {
          vehicleType: 'suv',
          package: 'titanium',
        },
      };

      const { result } = renderHook(() => useBookingWizard(props));

      await waitFor(() => {
        expect(result.current.isReschedule).toBe(true);
        expect(result.current.booking.vehicleType).toBe('suv');
        expect(result.current.booking.package).toBe('titanium');
        expect(result.current.currentStep).toBe(3); // Starts at step 3 for reschedule
      });
    });
  });

  describe('Add-on Management', () => {
    it('should handle add-on changes', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleAddOnChange('tip', 20);
        result.current.handleAddOnChange('exterior_wax', true);
      });

      expect(result.current.selectedAddOns).toEqual({
        tip: 20,
        exterior_wax: true,
      });
    });

    it('should update existing add-on value', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleAddOnChange('tip', 10);
      });

      expect(result.current.selectedAddOns.tip).toBe(10);

      act(() => {
        result.current.handleAddOnChange('tip', 50);
      });

      expect(result.current.selectedAddOns.tip).toBe(50);
    });
  });

  describe('Date and Time Handling', () => {
    it('should handle date change', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleDateChange('2026-02-14');
      });

      expect(result.current.booking.date).toBe('2026-02-14');
    });

    it('should clear time when date changes', async () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleTimeSelect('14:00');
      });

      expect(result.current.booking.time).toBe('14:00');

      act(() => {
        result.current.handleDateChange('2026-02-14');
      });

      await waitFor(() => {
        expect(result.current.booking.time).toBe('');
      });
    });

    it('should handle time selection', () => {
      const { result } = renderHook(() => useBookingWizard(defaultProps));

      act(() => {
        result.current.handleTimeSelect('18:00');
      });

      expect(result.current.booking.time).toBe('18:00');
    });
  });

  describe('getTodayDate helper', () => {
    it('should return today in YYYY-MM-DD format', () => {
      const today = getTodayDate();
      const expected = new Date().toISOString().split('T')[0];
      expect(today).toBe(expected);
    });
  });

  describe('ALL_TIME_SLOTS', () => {
    it('should have proper structure for each slot', () => {
      ALL_TIME_SLOTS.forEach(slot => {
        expect(slot).toHaveProperty('id');
        expect(slot).toHaveProperty('label');
        expect(slot).toHaveProperty('hour');
        expect(typeof slot.id).toBe('string');
        expect(typeof slot.label).toBe('string');
        expect(typeof slot.hour).toBe('number');
      });
    });

    it('should have hours in ascending order', () => {
      for (let i = 1; i < ALL_TIME_SLOTS.length; i++) {
        expect(ALL_TIME_SLOTS[i].hour).toBeGreaterThan(ALL_TIME_SLOTS[i - 1].hour);
      }
    });
  });
});
