/**
 * Pricing calculation utilities
 * Platform-agnostic pricing logic shared across web, mobile, and Cloud Functions
 */
import type {
  PackageId,
  PackageConfig,
  VehicleTypeId,
  VehicleSize,
  SelectedAddOn,
} from '../types';
import { PACKAGES, VEHICLE_TYPES } from '../config/packages';
import { MONTHLY_SUBSCRIPTION_DISCOUNT } from '../constants/status';

/**
 * Calculate base price for a package + vehicle combination
 */
export const calculateBasePrice = (
  packageId: PackageId,
  vehicleType: VehicleTypeId,
  vehicleSize: VehicleSize | null = null,
  packages: Record<string, PackageConfig> = PACKAGES
): number | null => {
  const pkg = packages[packageId];
  if (!pkg) return null;

  const vehicleConfig = VEHICLE_TYPES.find((v) => v.id === vehicleType);
  if (vehicleConfig?.hasSizes && vehicleSize) {
    const priceKey = `${vehicleType}_${vehicleSize}`;
    return pkg.prices[priceKey] ?? null;
  }

  return pkg.prices[vehicleType] ?? null;
};

/**
 * Calculate add-ons total
 */
export const calculateAddOnsTotal = (
  addOns: SelectedAddOn[]
): number => {
  return addOns
    .filter((a) => a.enabled)
    .reduce((total, addon) => total + (addon.customAmount ?? addon.price), 0);
};

/**
 * Calculate monthly subscription price (with discount)
 */
export const calculateSubscriptionPrice = (
  basePrice: number
): number => {
  return Math.round(basePrice * (1 - MONTHLY_SUBSCRIPTION_DISCOUNT));
};

/**
 * Calculate total price including add-ons and subscription discount
 */
export const calculateTotalPrice = (
  packageId: PackageId,
  vehicleType: VehicleTypeId,
  vehicleSize: VehicleSize | null = null,
  addOns: SelectedAddOn[] = [],
  isMonthlySubscription: boolean = false,
  packages: Record<string, PackageConfig> = PACKAGES
): { basePrice: number | null; addOnsTotal: number; totalPrice: number | null } => {
  const basePrice = calculateBasePrice(
    packageId,
    vehicleType,
    vehicleSize,
    packages
  );

  if (basePrice === null) {
    return { basePrice: null, addOnsTotal: 0, totalPrice: null };
  }

  const addOnsTotal = calculateAddOnsTotal(addOns);

  let effectiveBasePrice = basePrice;
  if (isMonthlySubscription) {
    effectiveBasePrice = calculateSubscriptionPrice(basePrice);
  }

  const totalPrice = effectiveBasePrice + addOnsTotal;

  return { basePrice: effectiveBasePrice, addOnsTotal, totalPrice };
};

/**
 * Verify server-side that a price matches the expected calculation
 * Used in Cloud Functions to prevent client-side price manipulation
 */
export const verifyPrice = (
  submittedPrice: number,
  packageId: PackageId,
  vehicleType: VehicleTypeId,
  vehicleSize: VehicleSize | null = null,
  addOns: SelectedAddOn[] = [],
  isMonthlySubscription: boolean = false,
  packages: Record<string, PackageConfig> = PACKAGES
): { valid: boolean; expectedPrice: number | null } => {
  const { totalPrice } = calculateTotalPrice(
    packageId,
    vehicleType,
    vehicleSize,
    addOns,
    isMonthlySubscription,
    packages
  );

  if (totalPrice === null) {
    return { valid: false, expectedPrice: null };
  }

  // Allow small floating point differences
  const valid = Math.abs(submittedPrice - totalPrice) < 0.01;
  return { valid, expectedPrice: totalPrice };
};
