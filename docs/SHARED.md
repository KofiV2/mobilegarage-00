# @3on/shared Package Documentation

The shared package provides platform-agnostic types, configuration, and utilities used across the web app, mobile app, and Cloud Functions.

## Installation

The package is included as a workspace dependency and can be imported directly:

```typescript
import { PACKAGES, calculateTotalPrice } from '@3on/shared';
import type { Booking, PackageId } from '@3on/shared';
```

## Package Structure

```
packages/shared/
├── src/
│   ├── index.ts           # Main export file
│   ├── types/
│   │   └── index.ts       # TypeScript type definitions
│   ├── config/
│   │   ├── packages.ts    # Package & vehicle configuration
│   │   └── emirates.ts    # UAE emirates list
│   ├── constants/
│   │   └── status.ts      # Booking status definitions
│   └── utils/
│       ├── formatters.ts  # Display formatting functions
│       ├── pricing.ts     # Price calculation utilities
│       └── validation.ts  # Input validation utilities
```

---

## Types

### Vehicle Types

```typescript
type VehicleTypeId = 'sedan' | 'suv' | 'motorcycle' | 'caravan' | 'boat';

type VehicleSize = 'small' | 'medium' | 'large';

interface Vehicle {
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
```

### Package Types

```typescript
type PackageId = 'platinum' | 'titanium' | 'diamond';

interface PackageConfig {
  id: PackageId;
  prices: Record<string, number | null>;
  icon: string;
  available: boolean;
  popular?: boolean;
  featureCount: number;
}

interface AddOnConfig {
  id: string;
  icon: string;
  defaultPrice: number;
  hasCustomAmount?: boolean;
  presetAmounts?: number[];
}

interface SelectedAddOn {
  id: string;
  price: number;
  enabled: boolean;
  customAmount?: number;
}
```

### Booking Types

```typescript
type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'on_the_way' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

type PaymentMethod = 'cash' | 'card' | 'geidea' | 'payment_link';
type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
type BookingSource = 'customer' | 'staff';

interface Booking {
  id: string;
  userId?: string;
  source: BookingSource;
  enteredBy?: string;
  
  // Customer
  userName?: string;
  userPhone?: string;
  customerData?: { name: string; phone: string };
  
  // Service
  package: PackageId;
  vehicleType: VehicleTypeId;
  vehicleSize?: VehicleSize;
  
  // Location
  location: Location;
  
  // Pricing
  price: number;
  totalPrice: number;
  addOns?: Record<string, boolean | number>;
  addOnsPrice?: number;
  isMonthlySubscription?: boolean;
  
  // Payment & Status
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  
  // Scheduling
  date: string;
  time: string;
  createdAt: Date;
}
```

### User Types

```typescript
type UserRole = 'customer' | 'staff' | 'manager';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  language: 'en' | 'ar';
  role: UserRole;
  loyaltyPoints?: number;
  totalBookings?: number;
  createdAt: Date;
}
```

---

## Configuration

### Packages

```typescript
import { PACKAGES, PACKAGES_LIST, getPackagePrice, vehicleRequiresSize } from '@3on/shared';

// Full package definitions
PACKAGES.platinum.prices.sedan  // 45
PACKAGES.titanium.prices.suv    // 80

// Simplified list for display
PACKAGES_LIST.map(pkg => pkg.sedanPrice);  // [45, 75, 110]

// Get price for vehicle + package combination
getPackagePrice('titanium', 'caravan', 'large');  // 180

// Check if size selection needed
vehicleRequiresSize('boat');  // true
vehicleRequiresSize('sedan'); // false
```

### Vehicle Types

```typescript
import { VEHICLE_TYPES, VEHICLE_SIZES } from '@3on/shared';

// All vehicle types with icons
VEHICLE_TYPES
// [
//   { id: 'sedan', icon: '🚗', hasSizes: false },
//   { id: 'suv', icon: '🚙', hasSizes: false },
//   { id: 'motorcycle', icon: '🏍️', hasSizes: false },
//   { id: 'caravan', icon: '🚐', hasSizes: true },
//   { id: 'boat', icon: '🚤', hasSizes: true },
// ]

// Size options for specific vehicle types
VEHICLE_SIZES.caravan  // [{ id: 'small', icon: '🚐' }, ...]
VEHICLE_SIZES.boat     // [{ id: 'small', icon: '🚤' }, ...]
```

### Default Add-ons

```typescript
import { DEFAULT_ADDONS } from '@3on/shared';

// Available add-ons for Platinum package
DEFAULT_ADDONS
// [
//   { id: 'tip', icon: '💰', defaultPrice: 10, hasCustomAmount: true, presetAmounts: [5, 10, 20, 50] },
//   { id: 'exterior_wax', icon: '✨', defaultPrice: 25 },
//   { id: 'plastic_seats', icon: '🛡️', defaultPrice: 15 },
//   { id: 'tissue_box', icon: '🧻', defaultPrice: 10 },
// ]
```

### Emirates

```typescript
import { EMIRATES, getEmirateName } from '@3on/shared';

// All UAE emirates
EMIRATES
// [
//   { id: 'dubai', name: 'Dubai' },
//   { id: 'sharjah', name: 'Sharjah' },
//   { id: 'ajman', name: 'Ajman' },
//   { id: 'abu_dhabi', name: 'Abu Dhabi' },
//   { id: 'ras_al_khaimah', name: 'Ras Al Khaimah' },
//   { id: 'fujairah', name: 'Fujairah' },
//   { id: 'umm_al_quwain', name: 'Umm Al Quwain' },
// ]

getEmirateName('dubai');       // 'Dubai'
getEmirateName('abu_dhabi');   // 'Abu Dhabi'
```

---

## Constants

### Status Flow

```typescript
import {
  STATUS_ORDER,
  STATUS_FLOW,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
  STATUS_COLORS,
  STATUS_ICONS,
  isValidTransition,
  getNextStatus,
  isActiveStatus,
} from '@3on/shared';

// Normal progression order
STATUS_ORDER
// ['pending', 'confirmed', 'on_the_way', 'in_progress', 'completed']

// Valid transitions from each status
STATUS_FLOW.pending      // ['confirmed', 'cancelled']
STATUS_FLOW.confirmed    // ['on_the_way', 'cancelled']
STATUS_FLOW.completed    // [] (terminal)

// UI helpers
STATUS_COLORS.pending    // '#f59e0b' (amber)
STATUS_ICONS.on_the_way  // '🚗'

// Transition validation
isValidTransition('pending', 'confirmed');     // true
isValidTransition('pending', 'completed');     // false

// Get next status
getNextStatus('confirmed');  // 'on_the_way'
getNextStatus('completed');  // null

// Check if active
isActiveStatus('in_progress');  // true
isActiveStatus('cancelled');    // false
```

### Time Slots

```typescript
import { TIME_SLOTS, MONTHLY_SUBSCRIPTION_DISCOUNT } from '@3on/shared';

// Business hours: 12 PM - 12 AM
TIME_SLOTS
// ['12:00', '13:00', '14:00', ..., '23:00']

// Monthly subscription discount
MONTHLY_SUBSCRIPTION_DISCOUNT  // 0.075 (7.5%)
```

---

## Utilities

### Pricing

```typescript
import {
  calculateBasePrice,
  calculateAddOnsTotal,
  calculateSubscriptionPrice,
  calculateTotalPrice,
  verifyPrice,
} from '@3on/shared';

// Base price for package + vehicle
calculateBasePrice('titanium', 'sedan');  // 75

// Add-ons total
const addOns = [
  { id: 'tip', price: 10, enabled: true, customAmount: 20 },
  { id: 'exterior_wax', price: 25, enabled: true },
];
calculateAddOnsTotal(addOns);  // 45

// Subscription discount
calculateSubscriptionPrice(100);  // 93 (100 * 0.925)

// Complete calculation
calculateTotalPrice('platinum', 'sedan', null, addOns, false);
// { basePrice: 45, addOnsTotal: 45, totalPrice: 90 }

// Monthly subscription
calculateTotalPrice('platinum', 'sedan', null, [], true);
// { basePrice: 42, addOnsTotal: 0, totalPrice: 42 }

// Server-side price verification
verifyPrice(90, 'platinum', 'sedan', null, addOns, false);
// { valid: true, expectedPrice: 90 }
```

### Validation

```typescript
import {
  ValidationRules,
  ValidationSchemas,
  validateField,
  validateForm,
  hasErrors,
  formatPhoneNumber,
  sanitizeInput,
  isValidPhone,
} from '@3on/shared';

// Individual rules
ValidationRules.required('');           // 'This field is required'
ValidationRules.email('bad');           // 'Please enter a valid email address'
ValidationRules.phone('5551234567');    // null (valid)
ValidationRules.phone('1234');          // 'Phone number must be 9 digits'
ValidationRules.name('A');              // 'Name must be at least 2 characters'

// Validate single field
validateField('test@', [ValidationRules.email]);  // 'Please enter a valid email'

// Validate entire form
const errors = validateForm(
  { phone: '123', name: '' },
  ValidationSchemas.profile
);
// { phone: 'Phone number must be 9 digits', name: 'Name is required' }

hasErrors(errors);  // true

// Phone formatting for display
formatPhoneNumber('501234567');  // '50 123 4567'

// Security helpers
sanitizeInput('<script>evil</script>');
// '&lt;script&gt;evil&lt;/script&gt;'

isValidPhone('0501234567');   // true
isValidPhone('+971501234567'); // true
```

### Formatters

```typescript
import {
  formatDate,
  formatTime,
  formatPrice,
  formatStatus,
  formatPhoneDisplay,
  formatVehicleType,
  formatPackageName,
} from '@3on/shared';

formatDate(new Date());        // 'Saturday, January 15, 2024'
formatTime('14:00');           // '2:00 PM'
formatPrice(75);               // 'AED 75'
formatPriceDetailed(75.5);     // 'AED 75.50'
formatStatus('on_the_way');    // 'On the Way'
formatPhoneDisplay('501234567'); // '+971 50 123 4567'
formatVehicleType('suv');      // 'SUV'
formatPackageName('titanium'); // 'Titanium'
```

---

## Usage Examples

### Create Booking Flow (Web/Mobile)

```typescript
import {
  PACKAGES,
  VEHICLE_TYPES,
  calculateTotalPrice,
  validateForm,
  ValidationSchemas,
  type Booking,
  type SelectedAddOn,
} from '@3on/shared';

// Step 1: Select vehicle
const selectedVehicle = 'suv';
const requiresSize = vehicleRequiresSize(selectedVehicle);

// Step 2: Select package
const availablePackages = Object.values(PACKAGES).filter(
  pkg => pkg.available && pkg.prices[selectedVehicle] !== null
);

// Step 3: Calculate price
const addOns: SelectedAddOn[] = [
  { id: 'tip', price: 10, enabled: true, customAmount: 15 }
];

const { totalPrice, basePrice, addOnsTotal } = calculateTotalPrice(
  'titanium',
  selectedVehicle,
  null,
  addOns,
  false
);

// Step 4: Validate customer data
const errors = validateForm(
  { phone: '501234567', name: 'John' },
  ValidationSchemas.profile
);

if (!hasErrors(errors)) {
  // Submit booking
}
```

### Display Booking Details

```typescript
import {
  formatDate,
  formatPrice,
  formatStatus,
  STATUS_COLORS,
  STATUS_ICONS,
  getNextStatus,
  isValidTransition,
} from '@3on/shared';

function BookingCard({ booking }: { booking: Booking }) {
  const statusColor = STATUS_COLORS[booking.status];
  const statusIcon = STATUS_ICONS[booking.status];
  const nextStatus = getNextStatus(booking.status);
  
  return (
    <div>
      <span style={{ color: statusColor }}>
        {statusIcon} {formatStatus(booking.status)}
      </span>
      <p>{formatDate(booking.date)}</p>
      <p>{formatPrice(booking.totalPrice)}</p>
      
      {nextStatus && isValidTransition(booking.status, nextStatus) && (
        <button onClick={() => updateStatus(nextStatus)}>
          Move to {formatStatus(nextStatus)}
        </button>
      )}
    </div>
  );
}
```

---

## Building

```bash
cd packages/shared

# Type-check
npm run typecheck

# Build for production
npm run build
```
