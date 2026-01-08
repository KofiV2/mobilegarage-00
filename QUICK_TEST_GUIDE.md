# Quick Test Guide - Onboarding & Authentication

## Quick Setup

### 1. Install Dependencies
```bash
cd apps/mobile
npm install
```

### 2. Start the App
```bash
# Development mode
npm start

# Or with specific platform
npx expo start --ios
npx expo start --android
```

### 3. Start Backend (for OTP testing)
```bash
cd apps/api
npm run dev
```

## Testing Scenarios

### Scenario 1: First-Time User (Phone Login)

**Steps:**
1. Clear app data (reinstall or clear storage)
2. Launch app → Welcome screen appears
3. Tap "Continue with Phone"
4. Select country: UAE (+971)
5. Enter phone: 501234567
6. Tap "Send OTP"
7. Check console for OTP (in development)
8. Enter the 6-digit OTP
9. Choose location method
10. Complete setup

**Expected Result:**
- OTP sent successfully
- User logged in automatically
- Redirected to home screen

**Development OTP:**
Check backend console for: `Sending OTP 123456 to +971501234567`

---

### Scenario 2: Guest Mode Flow

**Steps:**
1. Launch app → Welcome screen
2. Tap "Continue as Guest"
3. Set location (GPS or manual)
4. Browse services
5. Select a service
6. Go to checkout
7. Select payment method
8. Authentication modal appears
9. Login or create account
10. Complete booking

**Expected Result:**
- Guest can browse everything
- Blocked at checkout
- Must authenticate to proceed
- Converted from guest to authenticated user

---

### Scenario 3: Email/Password Login

**Steps:**
1. Launch app → Welcome screen
2. Tap "Continue with Email"
3. Enter email and password
4. Tap "Login"
5. Redirected to home

**Expected Result:**
- Standard email login works
- No location setup needed (if already set)

---

### Scenario 4: Location Services

#### GPS Location:
1. Choose "Use Current Location"
2. Allow permission when prompted
3. Location detected automatically
4. Proceed to home

#### Manual Location:
1. Choose "Enter Manually"
2. Select Emirate (e.g., Dubai)
3. Select Area (e.g., Dubai Marina)
4. Proceed to home

#### Denied Permission:
1. Choose "Use Current Location"
2. Deny permission
3. Alert appears
4. Fall back to manual entry

**Expected Result:**
- Both methods work independently
- Location saved to AsyncStorage
- Can skip and set later

---

### Scenario 5: OTP Resend

**Steps:**
1. Start phone login
2. Send OTP
3. Wait (don't enter OTP)
4. Tap "Didn't receive code? Resend"
5. New OTP generated

**Expected Result:**
- Old OTP invalidated
- New OTP sent
- 5-minute timer resets

---

## Quick Checks

### Check AsyncStorage Data:

**In development:**
```javascript
// In app, add this temporarily
import AsyncStorage from '@react-native-async-storage/async-storage';

const checkStorage = async () => {
  const welcomeSeen = await AsyncStorage.getItem('welcomeSeen');
  const guestMode = await AsyncStorage.getItem('guestMode');
  const location = await AsyncStorage.getItem('userLocation');
  const token = await AsyncStorage.getItem('token');

  console.log('Welcome Seen:', welcomeSeen);
  console.log('Guest Mode:', guestMode);
  console.log('Location:', location);
  console.log('Token:', token ? 'Present' : 'None');
};
```

### Clear App Data:

**React Native:**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear all data
await AsyncStorage.clear();
```

**Manual:**
- iOS: Uninstall app
- Android: Settings > Apps > Clear Data

---

## API Testing

### Test OTP Endpoint:

```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+971501234567"}'

# Response (development):
{
  "message": "OTP sent successfully",
  "otp": "123456"
}
```

### Test OTP Verification:

```bash
# Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+971501234567",
    "otp": "123456"
  }'

# Response:
{
  "user": {
    "id": "...",
    "email": "971501234567@phone.inandout.app",
    "phone": "+971501234567",
    "firstName": "User",
    "lastName": "4567"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Common Issues & Fixes

### Issue: Welcome screen shows every time
**Fix:**
```javascript
// Check if welcomeSeen is being set
await AsyncStorage.setItem('welcomeSeen', 'true');
```

### Issue: OTP not working
**Fix:**
- Check backend is running
- Check console for OTP code
- Verify phone format: +971501234567
- Check OTP hasn't expired (5 min)

### Issue: Location permission not requesting
**Fix:**
- Check app.json has permissions
- Rebuild app after adding permissions
- Check device settings allow location

### Issue: Guest checkout not showing auth modal
**Fix:**
```javascript
// Verify isGuest state in AuthContext
const { isGuest } = useAuth();
console.log('Is Guest:', isGuest);
```

### Issue: Navigation not working
**Fix:**
```bash
# Clear metro bundler cache
npx expo start --clear
```

---

## Development Tips

### 1. Quick Reset to Welcome:
```javascript
// Add this button in app for testing
<Button
  title="Reset to Welcome"
  onPress={async () => {
    await AsyncStorage.removeItem('welcomeSeen');
    // Restart app
  }}
/>
```

### 2. View OTP in UI (Development Only):
```javascript
// In phone-login.js
res.json({
  message: 'OTP sent successfully',
  otp // Show in development
});
```

### 3. Skip OTP Verification (Testing):
```javascript
// Temporary bypass for testing
if (process.env.NODE_ENV === 'development' && otp === '000000') {
  // Auto-verify
}
```

### 4. Test Multiple Countries:
```javascript
// Quickly switch test numbers
const testNumbers = {
  UAE: '+971501234567',
  Saudi: '+966501234567',
  Kuwait: '+965501234567'
};
```

---

## Testing Checklist

- [ ] First-time user sees welcome screen
- [ ] Phone login sends OTP
- [ ] OTP verification works
- [ ] Email login works
- [ ] Guest mode allows browsing
- [ ] Guest checkout requires auth
- [ ] Location GPS works
- [ ] Location manual entry works
- [ ] Location can be skipped
- [ ] OTP resend works
- [ ] OTP expires after 5 minutes
- [ ] Country code selector works
- [ ] All 6 countries available
- [ ] Dubai areas display correctly
- [ ] Abu Dhabi areas display correctly
- [ ] Payment methods display
- [ ] Auth modal shows for guests
- [ ] Login/Register switch works
- [ ] User stays logged in after restart
- [ ] Guest mode persists after restart

---

## Performance Testing

### Test App Startup:
```javascript
// Measure welcome screen decision
console.time('Welcome Check');
const welcomeSeen = await AsyncStorage.getItem('welcomeSeen');
console.timeEnd('Welcome Check'); // Should be < 100ms
```

### Test Location Detection:
```javascript
// Measure GPS response
console.time('Location');
const location = await Location.getCurrentPositionAsync();
console.timeEnd('Location'); // Varies, 1-5 seconds
```

---

## Screenshots to Verify

1. **Welcome Screen**: Gradient background, 3 auth options
2. **Phone Login**: Country selector, phone input
3. **OTP Screen**: 6 input fields, resend button
4. **Location Screen**: GPS & manual buttons
5. **Emirate Selection**: 7 emirates with icons
6. **Area Selection**: List of areas
7. **Checkout**: Payment methods
8. **Auth Modal**: Login/Register form

---

## Next Steps After Testing

1. Test on real devices (iOS & Android)
2. Test with slow network
3. Test with no network
4. Test location edge cases
5. Test with real SMS service (Twilio)
6. Perform security testing
7. Test accessibility features
8. Conduct user testing

---

## Support & Debugging

**Enable debug mode:**
```javascript
// In AuthContext.js
console.log('Auth State:', { user, token, isGuest });
```

**Check API connectivity:**
```javascript
// Test API connection
const response = await api.get('/health');
console.log('API Status:', response.status);
```

**Monitor OTP store:**
```javascript
// In auth.js
console.log('OTP Store Size:', otpStore.size);
```
