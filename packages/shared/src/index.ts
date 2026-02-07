/**
 * @3on/shared - Shared package for the 3ON Car Wash platform
 *
 * Re-exports all types, config, utilities, and constants
 * for use across web, mobile, and Cloud Functions.
 */

// Types
export type {
  VehicleTypeId,
  VehicleSize,
  VehicleTypeConfig,
  VehicleSizeConfig,
  Vehicle,
  PackageId,
  PriceKey,
  PackageConfig,
  PackageListItem,
  AddOnConfig,
  SelectedAddOn,
  Location,
  Emirate,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentProvider,
  BookingSource,
  Booking,
  UserRole,
  User,
  StaffMember,
  LoyaltyTier,
  LoyaltyRecord,
  Review,
  SubscriptionFrequency,
  SubscriptionStatus,
  Subscription,
  DiscountType,
  PromoCode,
  GeideaSession,
  PaymentResult,
  AuditAction,
  AuditLogEntry,
} from './types';

// Config
export {
  PACKAGES,
  PACKAGES_LIST,
  VEHICLE_TYPES,
  VEHICLE_SIZES,
  DEFAULT_ADDONS,
  getPackagePrice,
  vehicleRequiresSize,
} from './config/packages';

export { EMIRATES, getEmirateName } from './config/emirates';

// Constants
export {
  STATUS_ORDER,
  STATUS_FLOW,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
  STATUS_COLORS,
  STATUS_ICONS,
  isValidTransition,
  getNextStatus,
  isActiveStatus,
  generateTimeSlots,
  TIME_SLOTS,
  MONTHLY_SUBSCRIPTION_DISCOUNT,
} from './constants/status';

// Utils - Formatters
export {
  formatDate,
  formatTime,
  formatPrice,
  formatPriceDetailed,
  getStatusColor,
  getStatusIcon,
  formatStatus,
  formatPhoneDisplay,
  formatVehicleType,
  formatPackageName,
} from './utils/formatters';

// Utils - Validation
export {
  ValidationRules,
  ValidationSchemas,
  validateField,
  validateForm,
  hasErrors,
  formatPhoneNumber,
  sanitizeInput,
  escapeHtml,
  isValidPhone,
  sanitizePhoneUri,
  stripHtml,
  sanitizeUrl,
  checkPasswordStrength,
  debounceValidation,
  getFieldAriaProps,
} from './utils/validation';

// Utils - Pricing
export {
  calculateBasePrice,
  calculateAddOnsTotal,
  calculateSubscriptionPrice,
  calculateTotalPrice,
  verifyPrice,
} from './utils/pricing';
