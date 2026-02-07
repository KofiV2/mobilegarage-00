/**
 * Core type definitions for the 3ON Car Wash platform
 * Shared across web, mobile, and Cloud Functions
 */

// ============================================================
// Vehicle Types
// ============================================================

export type VehicleTypeId = 'sedan' | 'suv' | 'motorcycle' | 'caravan' | 'boat';

export type VehicleSize = 'small' | 'medium' | 'large';

export interface VehicleTypeConfig {
  id: VehicleTypeId;
  icon: string;
  hasSizes: boolean;
}

export interface VehicleSizeConfig {
  id: VehicleSize;
  icon: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  nickname?: string;
  type: VehicleTypeId;
  size?: VehicleSize;
  make?: string;
  model?: string;
  licensePlate?: string;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
}

// ============================================================
// Package Types
// ============================================================

export type PackageId = 'platinum' | 'titanium' | 'diamond';

export type PriceKey =
  | VehicleTypeId
  | `${Extract<VehicleTypeId, 'caravan' | 'boat'>}_${VehicleSize}`;

export interface PackageConfig {
  id: PackageId;
  prices: Record<string, number | null>;
  icon: string;
  available: boolean;
  popular?: boolean;
  featureCount: number;
}

export interface PackageListItem {
  id: PackageId;
  icon: string;
  sedanPrice: number | null;
  suvPrice: number | null;
  popular: boolean;
  featureCount: number;
}

// ============================================================
// Add-on Types
// ============================================================

export interface AddOnConfig {
  id: string;
  icon: string;
  defaultPrice: number;
  hasCustomAmount?: boolean;
  presetAmounts?: number[];
}

export interface SelectedAddOn {
  id: string;
  price: number;
  enabled: boolean;
  customAmount?: number;
}

// ============================================================
// Location Types
// ============================================================

export interface Location {
  area: string;
  street?: string;
  villa?: string;
  emirate?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  latitude?: number;
  longitude?: number;
  instructions?: string;
}

export interface Emirate {
  id: string;
  name: string;
}

// ============================================================
// Booking Types
// ============================================================

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'geidea' | 'payment_link';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded';

export type PaymentProvider = 'geidea' | 'stripe' | 'cash';

export type BookingSource = 'customer' | 'staff';

export interface Booking {
  id: string;
  userId?: string;
  source: BookingSource;
  enteredBy?: string;

  // Customer info
  userName?: string;
  userPhone?: string;
  guestPhone?: string;
  customerData?: {
    name: string;
    phone: string;
  };

  // Service details
  package: PackageId;
  vehicleType: VehicleTypeId;
  vehicleSize?: VehicleSize;
  vehicleId?: string;

  // Location
  location: Location;

  // Staff order extras
  vehiclesInArea?: number;
  vehicleImageUrl?: string;

  // Pricing
  price: number;
  totalPrice: number;
  addOns?: Record<string, boolean | number>;
  addOnsPrice?: number;
  isMonthlySubscription?: boolean;

  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProvider?: PaymentProvider;
  paymentSessionId?: string;
  paymentTransactionId?: string;

  // Status
  status: BookingStatus;
  bookingNumber?: string;
  assignedStaffId?: string;
  assignedStaff?: string;

  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
  date: string;
  time: string;
  scheduledDate?: string;
  scheduledTime?: string;

  // Notifications
  notificationSent?: boolean;
  notificationSentAt?: Date;
  telegramNotificationSent?: boolean;
  telegramNotificationSentAt?: Date;

  // Notes
  notes?: string;
}

// ============================================================
// User Types
// ============================================================

export type UserRole = 'customer' | 'staff' | 'manager';

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  language: 'en' | 'ar';
  theme?: 'light' | 'dark';
  role: UserRole;
  loyaltyPoints?: number;
  totalBookings?: number;
  referralCode?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  availableDays?: string[];
  availableHours?: { start: string; end: string };
  activeBookings: number;
  totalCompleted: number;
  rating?: number;
  isActive: boolean;
}

// ============================================================
// Loyalty Types
// ============================================================

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

export interface LoyaltyRecord {
  userId: string;
  washCount: number;
  freeWashAvailable: boolean;
  tier: LoyaltyTier;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  lastUpdated: Date;
}

// ============================================================
// Review Types
// ============================================================

export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

// ============================================================
// Subscription Types
// ============================================================

export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  packageId: PackageId;
  vehicleType: VehicleTypeId;
  vehicleSize?: VehicleSize;
  frequency: SubscriptionFrequency;
  nextBookingDate: string;
  location: Location;
  paymentProvider: PaymentProvider;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================================
// Promo Code Types
// ============================================================

export type DiscountType = 'percentage' | 'fixed';

export interface PromoCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
  applicablePackages?: PackageId[];
  isActive: boolean;
}

// ============================================================
// Payment Types
// ============================================================

export interface GeideaSession {
  sessionId: string;
  orderId: string;
  amount: number;
  currency: string;
  merchantReferenceId: string;
  callbackUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  provider: PaymentProvider;
  errorMessage?: string;
}

// ============================================================
// Audit Log Types
// ============================================================

export type AuditAction =
  | 'booking_created'
  | 'booking_status_changed'
  | 'booking_cancelled'
  | 'booking_edited'
  | 'pricing_updated'
  | 'addon_updated'
  | 'timeslot_changed'
  | 'staff_order_created'
  | 'login_failed'
  | 'promo_code_created'
  | 'promo_code_used';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  userId: string;
  userRole: UserRole;
  targetId?: string;
  targetCollection?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}
