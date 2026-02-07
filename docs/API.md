# Firebase Functions API Documentation

This document describes the Cloud Functions deployed for the 3ON Mobile Car Wash platform.

## Overview

The functions handle:
- Email notifications for staff-created orders
- Telegram notifications for all orders
- User role management (Custom Claims)
- Server-side booking creation with price verification

**Runtime**: Node.js 20  
**Region**: Default (us-central1)

---

## Cloud Functions

### `sendStaffOrderNotification`

**Trigger**: Firestore `onCreate` on `bookings/{bookingId}`

Sends an email notification to the owner when a staff member creates a new order.

**Behavior**:
- Only triggers for orders where `source === 'staff'`
- Sends formatted HTML email with order details
- Updates document with `notificationSent: true` on success

**Required Environment Variables**:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=3ON Car Wash
OWNER_EMAIL=owner@example.com
```

---

### `sendTelegramNotification`

**Trigger**: Firestore `onCreate` on `bookings/{bookingId}`

Sends a Telegram message for ALL new orders (staff and customer).

**Behavior**:
- Formats order details with emojis
- Includes Google Maps link if coordinates provided
- Updates document with `telegramNotificationSent: true` on success

**Required Environment Variables**:
```
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

**Telegram Message Format**:
```
🚗 NEW ORDER #ABC123

👤 Customer: John Doe
📞 Phone: 050 123 4567

🚙 Vehicle: SUV
📦 Package: Titanium
💰 Price: AED 80
💳 Payment: Cash

📍 Location: Dubai, Al Barsha
🗺 Map: https://www.google.com/maps?q=...

📅 Date: 2024-01-15
⏰ Time: 14:00

📱 Source: Customer Booking
```

---

### `testEmailConfig`

**Type**: HTTP Function (GET)

**Endpoint**: `https://<region>-<project>.cloudfunctions.net/testEmailConfig`

Tests email configuration status.

**Response**:
```json
{
  "status": "Configuration complete",
  "config": {
    "smtp": {
      "host": "Set",
      "port": "Set",
      "user": "Set",
      "password": "Set",
      "from": "3ON Car Wash"
    },
    "owner": {
      "email": "Set"
    }
  },
  "instructions": "Ready to send emails!"
}
```

---

### `testTelegramConfig`

**Type**: HTTP Function (GET)

**Endpoint**: `https://<region>-<project>.cloudfunctions.net/testTelegramConfig`

Tests Telegram configuration and optionally sends a test message.

**Query Parameters**:
- `test=true` - Sends a test message to the configured chat

**Response**:
```json
{
  "status": "Configuration complete",
  "config": {
    "bot_token": "Set",
    "chat_id": "Set"
  },
  "instructions": "Add ?test=true to send a test message"
}
```

---

### `setUserRole`

**Type**: Callable Function

Assigns a role to a user via Firebase Custom Claims.

**Authorization**: Requires caller to have `role: 'manager'` claim.

**Request Data**:
```typescript
{
  uid: string;    // Target user's Firebase UID
  role: string;   // 'customer' | 'staff' | 'manager'
}
```

**Response**:
```json
{
  "success": true,
  "uid": "user-id",
  "role": "staff"
}
```

**Errors**:
- `unauthenticated` - Caller not signed in
- `permission-denied` - Caller is not a manager
- `invalid-argument` - Missing uid/role or invalid role

**Example Usage** (Client):
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const setUserRole = httpsCallable(functions, 'setUserRole');

await setUserRole({ uid: 'user123', role: 'staff' });
```

---

### `onNewUser`

**Trigger**: Firebase Auth `onCreate`

Automatically assigns the `customer` role to newly created users.

**Behavior**:
- Sets custom claim `{ role: 'customer' }` on user creation
- Runs silently for all new auth users

---

### `createBooking`

**Type**: Callable Function

Creates a new booking with server-side price verification.

**Authorization**: 
- Public for customer bookings (with optional auth)
- Requires `staff` or `manager` role for staff orders

**Request Data**:
```typescript
interface CreateBookingData {
  // Required
  vehicleType: 'sedan' | 'suv' | 'motorcycle' | 'caravan' | 'boat';
  packageId: 'platinum' | 'titanium' | 'diamond';
  date: string;           // YYYY-MM-DD
  timeSlot: string;       // HH:00 format
  location: {
    area: string;
    street?: string;
    villa?: string;
    emirate?: string;
    coordinates?: { lat: number; lng: number };
    instructions?: string;
  };
  paymentMethod: 'cash' | 'card' | 'payment_link';
  
  // Optional
  vehicleSize?: 'small' | 'medium' | 'large';  // Required for caravan/boat
  addOns?: SelectedAddOn[];
  isMonthlySubscription?: boolean;
  guestPhone?: string;
  userName?: string;
  userPhone?: string;
  vehicleId?: string;
  vehiclesInArea?: number;       // Staff orders only
  vehicleImageUrl?: string;      // Staff orders only
  notes?: string;
  customerData?: { name: string; phone: string };
  source?: 'customer' | 'staff';
  enteredBy?: string;            // Staff name
}

interface SelectedAddOn {
  id: string;
  price: number;
  enabled: boolean;
  customAmount?: number;
}
```

**Response**:
```json
{
  "bookingId": "abc123xyz",
  "calculatedPrice": 95,
  "basePrice": 80,
  "addOnsTotal": 15
}
```

**Errors**:
- `invalid-argument` - Missing required fields or invalid package/vehicle
- `permission-denied` - Non-staff trying to create staff order

**Security Notes**:
- Prices are calculated server-side to prevent manipulation
- Client-submitted prices are ignored
- Staff orders are auto-confirmed, customer orders start as `pending`

---

## Audit Logging

All significant actions are logged to the `auditLog` collection:

```typescript
interface AuditLogEntry {
  action: string;           // e.g., 'booking_created', 'role_changed'
  performedBy: string;      // User ID
  performedByRole: string;  // 'customer' | 'staff' | 'manager'
  targetId?: string;        // Affected document ID
  targetCollection?: string;
  details?: object;         // Action-specific data
  timestamp: Timestamp;
}
```

---

## Deployment

```bash
cd functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy to Firebase
npm run deploy

# View logs
npm run logs
```

---

## Local Development

```bash
# Start Firebase emulators
npm run serve

# Shell mode for testing functions
npm run shell
```

In the shell, you can test callable functions:
```javascript
createBooking({
  vehicleType: 'sedan',
  packageId: 'platinum',
  date: '2024-01-15',
  timeSlot: '14:00',
  location: { area: 'Al Barsha' },
  paymentMethod: 'cash'
})
```

---

## Environment Variables

Set these in `functions/.env` or via Firebase CLI:

```bash
# Firebase CLI method
firebase functions:secrets:set SMTP_PASSWORD
```

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | Email | SMTP server hostname |
| `SMTP_PORT` | Email | SMTP port (usually 587) |
| `SMTP_USER` | Email | SMTP username/email |
| `SMTP_PASSWORD` | Email | SMTP password or app password |
| `SMTP_FROM` | Email | Sender display name |
| `OWNER_EMAIL` | Email | Recipient for staff order notifications |
| `TELEGRAM_BOT_TOKEN` | Telegram | Bot API token from @BotFather |
| `TELEGRAM_CHAT_ID` | Telegram | Target chat/group ID |
