# Complete Onboarding & Authentication Guide

This guide explains the comprehensive first-time user experience and authentication system for the In & Out Car Wash mobile app.

## Overview

The app now features a complete onboarding flow with multiple authentication options, location services, and guest mode functionality.

## Features Implemented

### 1. Welcome Screen (`apps/mobile/app/welcome.js`)

**First-time user experience** - Shows when the app is launched for the first time:

- **Beautiful gradient UI** with car wash branding
- **Three authentication options:**
  - Phone/OTP Login (Primary)
  - Email/Password Login
  - Guest Mode
- **Feature highlights** to educate users
- **Sign-up link** for new users

### 2. Phone/OTP Authentication (`apps/mobile/app/phone-login.js`)

**Two-step phone verification:**

#### Step 1: Phone Number Entry
- **Country code selector** with 6 UAE/GCC countries:
  - 🇦🇪 UAE (+971)
  - 🇸🇦 Saudi Arabia (+966)
  - 🇰🇼 Kuwait (+965)
  - 🇧🇭 Bahrain (+973)
  - 🇶🇦 Qatar (+974)
  - 🇴🇲 Oman (+968)
- Visual country flags and dropdown selection
- Phone number input with country code prefix

#### Step 2: OTP Verification
- 6-digit OTP input fields
- Auto-focus between input fields
- OTP resend functionality
- 5-minute expiration time
- Ability to change phone number

### 3. Location Setup (`apps/mobile/app/location-setup.js`)

**Two location methods:**

#### Automatic Location (GPS)
- Requests location permissions (iOS & Android)
- Uses device GPS to detect current location
- Reverse geocoding to get address details
- Falls back to manual entry if permission denied

#### Manual Location Entry
- **Emirate selection:**
  - Abu Dhabi 🏛️
  - Dubai 🏙️
  - Sharjah 🕌
  - Ajman 🏖️
  - Umm Al Quwain 🌊
  - Ras Al Khaimah ⛰️
  - Fujairah 🏔️

- **Area selection** (pre-populated for Dubai & Abu Dhabi):
  - Dubai: 18 major areas (Marina, JBR, Downtown, etc.)
  - Abu Dhabi: 15 major areas (Reem Island, Yas, etc.)
  - Other emirates: Custom area entry

- **Skip option** - Users can set location later

### 4. Guest Mode

**Browse without account:**

- Users can explore all services
- View service details and pricing
- Browse available time slots
- **Checkout restriction:** Guest users must login/register to complete booking

### 5. Checkout Flow (`apps/mobile/app/checkout.js`)

**Payment method selection with authentication:**

#### For Guest Users:
1. Select payment method triggers authentication modal
2. **Modal offers two options:**
   - Login with existing account
   - Create new account
3. Form dynamically switches between login/register
4. After authentication, booking proceeds

#### For Authenticated Users:
1. Direct payment method selection
2. Immediate booking completion

**Payment Methods Available:**
- Credit/Debit Card 💳
- Cash on Service 💵
- Apple Pay
- Google Pay 🌐

### 6. Enhanced AuthContext (`apps/mobile/context/AuthContext.js`)

**New authentication features:**

```javascript
// Guest Mode
continueAsGuest() // Mark user as guest
isGuest // Check if user is in guest mode

// Phone/OTP Login
loginWithPhone(phoneNumber) // Send OTP
verifyOTP(phoneNumber, otp) // Verify and login/register

// Guest Conversion
convertGuestToUser(authData) // Convert guest to authenticated user
```

### 7. Backend API Routes (`apps/api/src/routes/auth.js`)

**New endpoints:**

#### POST `/api/auth/send-otp`
```json
{
  "phoneNumber": "+971501234567"
}
```
Response:
```json
{
  "message": "OTP sent successfully",
  "otp": "123456" // Only in development mode
}
```

#### POST `/api/auth/verify-otp`
```json
{
  "phoneNumber": "+971501234567",
  "otp": "123456"
}
```
Response:
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "phone": "+971501234567",
    "firstName": "User",
    "lastName": "1234"
  },
  "token": "jwt-token-here"
}
```

**Features:**
- 6-digit random OTP generation
- 5-minute expiration
- In-memory OTP storage (use Redis in production)
- Automatic user creation if phone doesn't exist
- Phone number validation (E.164 format)
- Mock SMS sending (integrate Twilio in production)

## User Flow Examples

### Flow 1: First-Time User with Phone Login

1. **Launch app** → Welcome screen appears
2. **Tap "Continue with Phone"** → Phone login screen
3. **Select country code** → Choose UAE (+971)
4. **Enter phone number** → 50 123 4567
5. **Tap "Send OTP"** → OTP sent
6. **Enter 6-digit OTP** → Verify
7. **Location setup** → Allow GPS or enter manually
8. **Select Emirate** → Dubai
9. **Select Area** → Dubai Marina
10. **Redirected to home** → Start browsing

### Flow 2: Guest User Booking

1. **Launch app** → Welcome screen
2. **Tap "Continue as Guest"** → Location setup
3. **Set location** → Browse services
4. **Select service** → Choose time slot
5. **Proceed to checkout** → Select payment method
6. **Authentication modal appears** → Must login/register
7. **Complete authentication** → Booking confirmed

### Flow 3: Email/Password Login

1. **Launch app** → Welcome screen
2. **Tap "Continue with Email"** → Login screen
3. **Enter credentials** → Email & password
4. **Tap "Login"** → Authenticated
5. **Redirected to home** → Full access

## Location Permissions

### iOS (app.json)
```json
{
  "NSLocationWhenInUseUsageDescription": "We need your location to provide car wash services at your current location.",
  "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location to provide car wash services at your current location."
}
```

### Android (app.json)
```json
{
  "permissions": [
    "ACCESS_COARSE_LOCATION",
    "ACCESS_FINE_LOCATION"
  ]
}
```

## Data Storage

### AsyncStorage Keys:

- `welcomeSeen`: "true" - User has seen welcome screen
- `token`: JWT authentication token
- `user`: User object JSON string
- `guestMode`: "true" - User is in guest mode
- `userLocation`: Location data JSON string

### Location Data Structure:
```json
{
  "latitude": 25.2048,
  "longitude": 55.2708,
  "city": "Dubai",
  "region": "Dubai",
  "country": "UAE",
  "emirate": "Dubai",
  "area": "Dubai Marina",
  "manualEntry": false
}
```

## Navigation Structure

```
app/
├── index.js                 # Entry point - checks first-time user
├── welcome.js              # Welcome/onboarding screen
├── phone-login.js          # Phone/OTP authentication
├── location-setup.js       # Location permission & selection
├── checkout.js             # Payment & checkout with auth
├── (auth)/
│   ├── login.js           # Email/password login
│   └── register.js        # User registration
└── (tabs)/
    ├── home.js            # Main screen
    ├── services.js        # Services listing
    ├── bookings.js        # User bookings
    └── profile.js         # User profile
```

## Testing the Features

### 1. Test First-Time User Flow:
```bash
# Clear app data to simulate first-time user
# On Android: Settings > Apps > In & Out Car Wash > Clear Data
# On iOS: Uninstall and reinstall
```

### 2. Test OTP Flow:
- In development mode, OTP is returned in API response
- Check console logs for OTP: `Sending OTP 123456 to +971501234567`

### 3. Test Guest Mode:
1. Choose "Continue as Guest"
2. Browse services
3. Try to checkout
4. Verify authentication modal appears

### 4. Test Location Services:
- **Allow permission:** Should detect location automatically
- **Deny permission:** Should fall back to manual selection
- **Skip:** Should allow proceeding without location

## Production Considerations

### SMS Integration (Twilio):

1. Install Twilio SDK:
```bash
npm install twilio
```

2. Update `apps/api/src/routes/auth.js`:
```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendOTP(phoneNumber, otp) {
  await client.messages.create({
    body: `Your In & Out Car Wash verification code is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });
}
```

3. Add environment variables:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Redis for OTP Storage:

Instead of in-memory Map, use Redis:

```javascript
const redis = require('redis');
const client = redis.createClient();

// Store OTP
await client.setex(`otp:${phoneNumber}`, 300, otp); // 5 min expiry

// Verify OTP
const storedOTP = await client.get(`otp:${phoneNumber}`);
```

## Security Features

1. **OTP Expiration:** 5 minutes
2. **One-time use:** OTP deleted after verification
3. **Phone validation:** E.164 format required
4. **JWT tokens:** 7-day expiration
5. **Password hashing:** bcrypt with 10 rounds
6. **Guest isolation:** Limited access until authentication

## UI/UX Highlights

- **Gradient backgrounds** for visual appeal
- **Icon-based navigation** for better UX
- **Auto-focus** in OTP fields
- **Loading states** for all async operations
- **Error handling** with user-friendly messages
- **Keyboard-aware** scrolling
- **Platform-specific** adaptations (iOS/Android)
- **Accessibility** labels and hints

## Customization

### Change Country Codes:
Edit `COUNTRY_CODES` array in `apps/mobile/app/phone-login.js`

### Change UAE Areas:
Edit `DUBAI_AREAS` and `ABU_DHABI_AREAS` in `apps/mobile/app/location-setup.js`

### Change Theme Colors:
Update gradient colors in component files:
- Welcome: `['#FF6B35', '#F7931E']`
- Phone Login: `['#1E88E5', '#1565C0']`
- Location: `['#FF6B35', '#F7931E']`

## Troubleshooting

### Location not detecting:
- Check device location services are enabled
- Verify app has location permissions
- Try manual entry as fallback

### OTP not working:
- Check backend logs for OTP generation
- In development, OTP is logged to console
- Verify phone number format (+country code)

### Welcome screen keeps showing:
- Clear AsyncStorage if needed
- Check `welcomeSeen` key is being set

### Guest mode not working:
- Verify `continueAsGuest()` is called
- Check `guestMode` in AsyncStorage
- Ensure checkout detects guest status

## Next Steps

1. **Integrate SMS service** (Twilio, AWS SNS, or similar)
2. **Add Redis** for OTP storage
3. **Implement rate limiting** for OTP requests
4. **Add phone number verification** for existing users
5. **Create profile completion** screen for phone-only users
6. **Add social login** options (Google, Apple)
7. **Implement 2FA** for enhanced security
8. **Add location history** for quick selection

## Support

For issues or questions:
- Check console logs for errors
- Verify API endpoints are accessible
- Test in development mode first
- Check AsyncStorage data
