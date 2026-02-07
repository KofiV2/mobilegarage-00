import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Price Calculation Tests
 * Tests for the pricing logic used in useBookingWizard and useAddOns
 * 
 * These test the pure calculation functions that could be extracted
 * from the hooks for better reusability.
 */

// Mock package configuration (mirrors PACKAGES from @3on/shared)
const MOCK_PACKAGES = {
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
      boat_large: 180,
    },
    available: true,
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
    },
    available: true,
    popular: true,
  },
  diamond: {
    id: 'diamond',
    prices: {
      sedan: 110,
      suv: 120,
      motorcycle: null, // Not available for motorcycles
      caravan_small: null,
      caravan_medium: null,
      caravan_large: null,
    },
    available: true,
  },
};

const MOCK_VEHICLE_TYPES = [
  { id: 'sedan', icon: '🚗', hasSizes: false },
  { id: 'suv', icon: '🚙', hasSizes: false },
  { id: 'motorcycle', icon: '🏍️', hasSizes: false },
  { id: 'caravan', icon: '🚐', hasSizes: true },
  { id: 'boat', icon: '🚤', hasSizes: true },
];

const MONTHLY_SUBSCRIPTION_DISCOUNT = 0.075; // 7.5%

// Pure pricing calculation functions (extracted from useBookingWizard logic)
const calculateBasePrice = (packageId, vehicleType, vehicleSize = null) => {
  const pkg = MOCK_PACKAGES[packageId];
  if (!pkg) return 0;

  const vehicleConfig = MOCK_VEHICLE_TYPES.find(v => v.id === vehicleType);
  if (vehicleConfig?.hasSizes && vehicleSize) {
    const priceKey = `${vehicleType}_${vehicleSize}`;
    return pkg.prices[priceKey] || 0;
  }

  return pkg.prices[vehicleType] || 0;
};

const calculateSubscriptionPrice = (basePrice) => {
  return Math.round(basePrice * (1 - MONTHLY_SUBSCRIPTION_DISCOUNT));
};

const calculateAddOnsTotal = (selectedAddOns, addOnsConfig) => {
  let total = 0;

  Object.entries(selectedAddOns).forEach(([addonId, value]) => {
    if (!value) return;

    const addon = addOnsConfig.find(a => a.id === addonId);
    if (!addon || !addon.enabled) return;

    if (addonId === 'tip') {
      total += typeof value === 'number' ? value : addon.price;
    } else if (value === true) {
      total += addon.price;
    }
  });

  return total;
};

const calculateTotalPrice = (basePrice, addOnsTotal) => {
  return basePrice + addOnsTotal;
};

const calculateMonthlyTotal = (weeklyPrice) => {
  return weeklyPrice * 4;
};

describe('Price Calculations', () => {
  describe('calculateBasePrice', () => {
    describe('Standard vehicles (no size)', () => {
      it('should calculate price for sedan with platinum package', () => {
        expect(calculateBasePrice('platinum', 'sedan')).toBe(45);
      });

      it('should calculate price for sedan with titanium package', () => {
        expect(calculateBasePrice('titanium', 'sedan')).toBe(75);
      });

      it('should calculate price for sedan with diamond package', () => {
        expect(calculateBasePrice('diamond', 'sedan')).toBe(110);
      });

      it('should calculate price for SUV with platinum package', () => {
        expect(calculateBasePrice('platinum', 'suv')).toBe(50);
      });

      it('should calculate price for SUV with titanium package', () => {
        expect(calculateBasePrice('titanium', 'suv')).toBe(80);
      });

      it('should calculate price for SUV with diamond package', () => {
        expect(calculateBasePrice('diamond', 'suv')).toBe(120);
      });

      it('should calculate price for motorcycle with platinum package', () => {
        expect(calculateBasePrice('platinum', 'motorcycle')).toBe(30);
      });

      it('should calculate price for motorcycle with titanium package', () => {
        expect(calculateBasePrice('titanium', 'motorcycle')).toBe(50);
      });

      it('should return 0 for motorcycle with diamond package (not available)', () => {
        expect(calculateBasePrice('diamond', 'motorcycle')).toBe(0);
      });
    });

    describe('Vehicles with sizes', () => {
      it('should calculate price for small caravan with platinum', () => {
        expect(calculateBasePrice('platinum', 'caravan', 'small')).toBe(60);
      });

      it('should calculate price for medium caravan with platinum', () => {
        expect(calculateBasePrice('platinum', 'caravan', 'medium')).toBe(80);
      });

      it('should calculate price for large caravan with platinum', () => {
        expect(calculateBasePrice('platinum', 'caravan', 'large')).toBe(120);
      });

      it('should calculate price for small caravan with titanium', () => {
        expect(calculateBasePrice('titanium', 'caravan', 'small')).toBe(100);
      });

      it('should calculate price for medium caravan with titanium', () => {
        expect(calculateBasePrice('titanium', 'caravan', 'medium')).toBe(130);
      });

      it('should calculate price for large caravan with titanium', () => {
        expect(calculateBasePrice('titanium', 'caravan', 'large')).toBe(180);
      });

      it('should return 0 for caravan with diamond (not available)', () => {
        expect(calculateBasePrice('diamond', 'caravan', 'small')).toBe(0);
        expect(calculateBasePrice('diamond', 'caravan', 'medium')).toBe(0);
        expect(calculateBasePrice('diamond', 'caravan', 'large')).toBe(0);
      });

      it('should calculate price for small boat with platinum', () => {
        expect(calculateBasePrice('platinum', 'boat', 'small')).toBe(80);
      });

      it('should calculate price for medium boat with platinum', () => {
        expect(calculateBasePrice('platinum', 'boat', 'medium')).toBe(120);
      });

      it('should calculate price for large boat with platinum', () => {
        expect(calculateBasePrice('platinum', 'boat', 'large')).toBe(180);
      });
    });

    describe('Edge cases', () => {
      it('should return 0 for non-existent package', () => {
        expect(calculateBasePrice('non_existent', 'sedan')).toBe(0);
      });

      it('should return 0 for non-existent vehicle type', () => {
        expect(calculateBasePrice('platinum', 'non_existent')).toBe(0);
      });

      it('should return 0 for vehicle with size when size is not provided', () => {
        // Without size for a vehicle that requires size
        expect(calculateBasePrice('platinum', 'caravan', null)).toBe(0);
      });

      it('should ignore size for vehicles that dont have sizes', () => {
        // Sedan doesn't have sizes, so size should be ignored
        expect(calculateBasePrice('platinum', 'sedan', 'large')).toBe(45);
      });
    });
  });

  describe('calculateSubscriptionPrice', () => {
    it('should apply 7.5% discount to base price', () => {
      // 45 * (1 - 0.075) = 45 * 0.925 = 41.625 → 42 (rounded)
      expect(calculateSubscriptionPrice(45)).toBe(42);
    });

    it('should apply discount to SUV price', () => {
      // 50 * 0.925 = 46.25 → 46 (rounded)
      expect(calculateSubscriptionPrice(50)).toBe(46);
    });

    it('should apply discount to titanium sedan price', () => {
      // 75 * 0.925 = 69.375 → 69 (rounded)
      expect(calculateSubscriptionPrice(75)).toBe(69);
    });

    it('should apply discount to diamond SUV price', () => {
      // 120 * 0.925 = 111 (rounded)
      expect(calculateSubscriptionPrice(120)).toBe(111);
    });

    it('should handle zero price', () => {
      expect(calculateSubscriptionPrice(0)).toBe(0);
    });

    it('should round correctly for edge cases', () => {
      // 100 * 0.925 = 92.5 → 93 (rounded)
      expect(calculateSubscriptionPrice(100)).toBe(93);
    });

    it('should apply consistent discount percentage', () => {
      const prices = [30, 45, 50, 60, 75, 80, 100, 110, 120, 130, 180];

      prices.forEach(price => {
        const discounted = calculateSubscriptionPrice(price);
        const expectedDiscount = Math.round(price * (1 - MONTHLY_SUBSCRIPTION_DISCOUNT));
        expect(discounted).toBe(expectedDiscount);
      });
    });
  });

  describe('calculateAddOnsTotal', () => {
    const mockAddOns = [
      { id: 'tip', price: 10, enabled: true },
      { id: 'exterior_wax', price: 25, enabled: true },
      { id: 'plastic_seats', price: 15, enabled: true },
      { id: 'tissue_box', price: 10, enabled: true },
      { id: 'disabled_addon', price: 50, enabled: false },
    ];

    it('should return 0 for no selected add-ons', () => {
      expect(calculateAddOnsTotal({}, mockAddOns)).toBe(0);
    });

    it('should calculate single add-on', () => {
      expect(calculateAddOnsTotal({ exterior_wax: true }, mockAddOns)).toBe(25);
    });

    it('should calculate multiple add-ons', () => {
      const selected = {
        exterior_wax: true,
        plastic_seats: true,
        tissue_box: true,
      };
      expect(calculateAddOnsTotal(selected, mockAddOns)).toBe(50); // 25 + 15 + 10
    });

    it('should use custom tip amount', () => {
      expect(calculateAddOnsTotal({ tip: 20 }, mockAddOns)).toBe(20);
    });

    it('should use preset tip amount', () => {
      expect(calculateAddOnsTotal({ tip: 50 }, mockAddOns)).toBe(50);
    });

    it('should combine tip with other add-ons', () => {
      const selected = {
        tip: 15,
        exterior_wax: true,
      };
      expect(calculateAddOnsTotal(selected, mockAddOns)).toBe(40); // 15 + 25
    });

    it('should ignore disabled add-ons', () => {
      expect(calculateAddOnsTotal({ disabled_addon: true }, mockAddOns)).toBe(0);
    });

    it('should ignore add-ons with false value', () => {
      const selected = {
        exterior_wax: false,
        plastic_seats: true,
      };
      expect(calculateAddOnsTotal(selected, mockAddOns)).toBe(15);
    });

    it('should ignore add-ons with null value', () => {
      const selected = {
        exterior_wax: null,
        plastic_seats: true,
      };
      expect(calculateAddOnsTotal(selected, mockAddOns)).toBe(15);
    });

    it('should ignore add-ons with undefined value', () => {
      const selected = {
        exterior_wax: undefined,
        plastic_seats: true,
      };
      expect(calculateAddOnsTotal(selected, mockAddOns)).toBe(15);
    });

    it('should handle all add-ons selected', () => {
      const selected = {
        tip: 10,
        exterior_wax: true,
        plastic_seats: true,
        tissue_box: true,
      };
      expect(calculateAddOnsTotal(selected, mockAddOns)).toBe(60); // 10 + 25 + 15 + 10
    });

    it('should ignore unknown add-ons', () => {
      const selected = {
        unknown_addon: true,
        exterior_wax: true,
      };
      expect(calculateAddOnsTotal(selected, mockAddOns)).toBe(25);
    });
  });

  describe('calculateTotalPrice', () => {
    it('should add base price and add-ons', () => {
      expect(calculateTotalPrice(45, 25)).toBe(70);
    });

    it('should handle zero add-ons', () => {
      expect(calculateTotalPrice(75, 0)).toBe(75);
    });

    it('should handle zero base price', () => {
      expect(calculateTotalPrice(0, 30)).toBe(30);
    });

    it('should handle both zero', () => {
      expect(calculateTotalPrice(0, 0)).toBe(0);
    });

    it('should calculate complex total', () => {
      const basePrice = calculateSubscriptionPrice(80); // SUV titanium with discount = 74
      const addOnsTotal = 45; // Some add-ons
      expect(calculateTotalPrice(basePrice, addOnsTotal)).toBe(74 + 45);
    });
  });

  describe('calculateMonthlyTotal', () => {
    it('should multiply weekly price by 4', () => {
      expect(calculateMonthlyTotal(45)).toBe(180);
    });

    it('should work with subscription price', () => {
      const weeklyWithDiscount = calculateSubscriptionPrice(45); // 42
      expect(calculateMonthlyTotal(weeklyWithDiscount)).toBe(168);
    });

    it('should handle zero', () => {
      expect(calculateMonthlyTotal(0)).toBe(0);
    });

    it('should handle larger prices', () => {
      expect(calculateMonthlyTotal(180)).toBe(720);
    });
  });

  describe('Complete pricing scenarios', () => {
    it('should calculate platinum sedan one-time wash', () => {
      const basePrice = calculateBasePrice('platinum', 'sedan');
      const addOns = 0;
      const total = calculateTotalPrice(basePrice, addOns);

      expect(basePrice).toBe(45);
      expect(total).toBe(45);
    });

    it('should calculate titanium SUV with monthly subscription', () => {
      const basePrice = calculateBasePrice('titanium', 'suv'); // 80
      const subscriptionPrice = calculateSubscriptionPrice(basePrice); // 74
      const monthlyTotal = calculateMonthlyTotal(subscriptionPrice); // 296

      expect(basePrice).toBe(80);
      expect(subscriptionPrice).toBe(74);
      expect(monthlyTotal).toBe(296);
    });

    it('should calculate platinum sedan with all add-ons', () => {
      const mockAddOns = [
        { id: 'tip', price: 10, enabled: true },
        { id: 'exterior_wax', price: 25, enabled: true },
        { id: 'plastic_seats', price: 15, enabled: true },
        { id: 'tissue_box', price: 10, enabled: true },
      ];

      const basePrice = calculateBasePrice('platinum', 'sedan'); // 45
      const addOnsTotal = calculateAddOnsTotal(
        { tip: 20, exterior_wax: true, plastic_seats: true, tissue_box: true },
        mockAddOns
      ); // 20 + 25 + 15 + 10 = 70
      const total = calculateTotalPrice(basePrice, addOnsTotal); // 115

      expect(basePrice).toBe(45);
      expect(addOnsTotal).toBe(70);
      expect(total).toBe(115);
    });

    it('should calculate large caravan with titanium subscription and add-ons', () => {
      const mockAddOns = [
        { id: 'tip', price: 10, enabled: true },
        { id: 'exterior_wax', price: 25, enabled: true },
      ];

      const basePrice = calculateBasePrice('titanium', 'caravan', 'large'); // 180
      const subscriptionPrice = calculateSubscriptionPrice(basePrice); // 167
      const addOnsTotal = calculateAddOnsTotal({ tip: 50, exterior_wax: true }, mockAddOns); // 75
      const total = calculateTotalPrice(subscriptionPrice, addOnsTotal); // 242
      const monthlyTotal = calculateMonthlyTotal(subscriptionPrice); // 668

      expect(basePrice).toBe(180);
      expect(subscriptionPrice).toBe(167);
      expect(addOnsTotal).toBe(75);
      expect(total).toBe(242);
      expect(monthlyTotal).toBe(668);
    });

    it('should handle diamond motorcycle (not available)', () => {
      const basePrice = calculateBasePrice('diamond', 'motorcycle');

      expect(basePrice).toBe(0);
    });

    it('should handle boat pricing', () => {
      const smallBoat = calculateBasePrice('platinum', 'boat', 'small');
      const mediumBoat = calculateBasePrice('platinum', 'boat', 'medium');
      const largeBoat = calculateBasePrice('platinum', 'boat', 'large');

      expect(smallBoat).toBe(80);
      expect(mediumBoat).toBe(120);
      expect(largeBoat).toBe(180);
    });
  });

  describe('Price verification (anti-manipulation)', () => {
    const verifyPrice = (submittedPrice, packageId, vehicleType, vehicleSize, isSubscription, addOnsTotal) => {
      let basePrice = calculateBasePrice(packageId, vehicleType, vehicleSize);
      if (isSubscription) {
        basePrice = calculateSubscriptionPrice(basePrice);
      }
      const expectedTotal = calculateTotalPrice(basePrice, addOnsTotal);

      return {
        valid: Math.abs(submittedPrice - expectedTotal) < 0.01,
        expected: expectedTotal
      };
    };

    it('should verify correct price submission', () => {
      const result = verifyPrice(45, 'platinum', 'sedan', null, false, 0);
      expect(result.valid).toBe(true);
      expect(result.expected).toBe(45);
    });

    it('should reject manipulated price', () => {
      const result = verifyPrice(20, 'platinum', 'sedan', null, false, 0);
      expect(result.valid).toBe(false);
      expect(result.expected).toBe(45);
    });

    it('should verify subscription price', () => {
      const result = verifyPrice(42, 'platinum', 'sedan', null, true, 0);
      expect(result.valid).toBe(true);
    });

    it('should verify price with add-ons', () => {
      const result = verifyPrice(70, 'platinum', 'sedan', null, false, 25);
      expect(result.valid).toBe(true);
    });

    it('should reject price manipulation attempt', () => {
      // Attacker tries to submit platinum price for diamond service
      const result = verifyPrice(45, 'diamond', 'sedan', null, false, 0);
      expect(result.valid).toBe(false);
      expect(result.expected).toBe(110);
    });

    it('should verify caravan with size pricing', () => {
      const result = verifyPrice(80, 'platinum', 'caravan', 'medium', false, 0);
      expect(result.valid).toBe(true);
    });
  });
});
