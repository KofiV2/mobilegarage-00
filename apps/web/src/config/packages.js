/**
 * Centralized package configuration
 * Single source of truth for all package definitions across the app
 */

/**
 * Add-ons available for Platinum package only
 * Default prices - can be overridden by manager via Firestore config/addOns
 */
export const DEFAULT_ADDONS = [
  {
    id: 'tip',
    icon: '💰',
    defaultPrice: 10,
    hasCustomAmount: true, // Allows customer to enter custom amount
    presetAmounts: [5, 10, 20, 50]
  },
  {
    id: 'exterior_wax',
    icon: '✨',
    defaultPrice: 25
  },
  {
    id: 'plastic_seats',
    icon: '🛡️',
    defaultPrice: 15
  },
  {
    id: 'tissue_box',
    icon: '🧻',
    defaultPrice: 10
  }
];

export const VEHICLE_TYPES = [
  { id: 'sedan', icon: '🚗', hasSizes: false },
  { id: 'suv', icon: '🚙', hasSizes: false },
  { id: 'motorcycle', icon: '🏍️', hasSizes: false },
  { id: 'caravan', icon: '🚐', hasSizes: true },
  { id: 'boat', icon: '🚤', hasSizes: true }
];

export const VEHICLE_SIZES = {
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

/**
 * Package definitions with full pricing for all vehicle types
 */
export const PACKAGES = {
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
    available: true,
    featureCount: 3
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
    available: true,
    popular: true,
    featureCount: 8
  },
  diamond: {
    id: 'diamond',
    prices: {
      sedan: 110,
      suv: 120,
      motorcycle: null,
      caravan_small: null,
      caravan_medium: null,
      caravan_large: null,
      boat_small: null,
      boat_medium: null,
      boat_large: null
    },
    icon: '💎',
    available: true,
    featureCount: 3
  }
};

/**
 * Simplified package list for display purposes (e.g., ServicesPage, AuthPage)
 */
export const PACKAGES_LIST = Object.values(PACKAGES).map(pkg => ({
  id: pkg.id,
  icon: pkg.icon,
  sedanPrice: pkg.prices.sedan,
  suvPrice: pkg.prices.suv,
  popular: pkg.popular || false,
  featureCount: pkg.featureCount
}));

/**
 * Get price for a specific vehicle type and package
 * @param {string} packageId - Package ID (platinum, titanium, diamond)
 * @param {string} vehicleType - Vehicle type (sedan, suv, motorcycle, caravan, boat)
 * @param {string} vehicleSize - Optional size for caravan/boat (small, medium, large)
 * @returns {number|null} Price in AED or null if not available
 */
export const getPackagePrice = (packageId, vehicleType, vehicleSize = null) => {
  const pkg = PACKAGES[packageId];
  if (!pkg) return null;

  const vehicleConfig = VEHICLE_TYPES.find(v => v.id === vehicleType);
  if (vehicleConfig?.hasSizes && vehicleSize) {
    const priceKey = `${vehicleType}_${vehicleSize}`;
    return pkg.prices[priceKey] ?? null;
  }

  return pkg.prices[vehicleType] ?? null;
};

/**
 * Check if a vehicle type requires size selection
 * @param {string} vehicleType - Vehicle type ID
 * @returns {boolean}
 */
export const vehicleRequiresSize = (vehicleType) => {
  const config = VEHICLE_TYPES.find(v => v.id === vehicleType);
  return config?.hasSizes || false;
};

export default PACKAGES;
