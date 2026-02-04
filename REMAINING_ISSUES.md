# Remaining Issues - 3ON Mobile Carwash

**Last Updated:** 2026-02-04

## Security Issues Fixed (4/4 Completed)

### ✅ Fixed: Client-side Authentication with Password Hashing
- **Files Changed:** `StaffAuthContext.jsx`, `ManagerAuthContext.jsx`
- **Solution:** Added SHA-256 password hashing with email salt
- **New Feature:** Rate limiting (5 attempts, 15-30 min lockout)
- **Migration:** Legacy plaintext passwords still work but log warnings

### ✅ Fixed: Session Hijacking Prevention
- **Files Changed:** `StaffAuthContext.jsx`, `ManagerAuthContext.jsx`, `AuthContext.jsx`
- **New File:** `utils/secureSession.js`
- **Solution:** HMAC-SHA256 signed session tokens
- **Features:**
  - Sessions are cryptographically signed
  - Tampering detection (signature verification)
  - Unique session IDs per login
  - Periodic session validation (every 5 minutes)

### ✅ Fixed: Guest Self-Elevation Prevention
- **Files Changed:** `AuthContext.jsx`
- **Solution:** Guest sessions now use signed tokens
- **Features:**
  - Cryptographically signed guest sessions
  - Session ID tracking for booking attribution
  - `validateGuestSession()` function for route protection

### ✅ Fixed: Firestore Security Rules
- **File Changed:** `firestore.rules`
- **Improvements:**
  - String length validation (prevents data stuffing)
  - Price range validation (0-5000)
  - Loyalty count manipulation prevention (increment by 1 only)
  - Immutable field protection (userId, createdAt, price)
  - Guest bookings collection with session ID validation
  - Maximum field count limits

---

## Remaining Issues (34 Total)

### 🔴 Critical - Security (1 Remaining)

1. **Plaintext Credentials in .env Files**
   - **Status:** Partially addressed
   - **What's Done:** Updated `.env.example` with instructions for hashing
   - **Still Needed:**
     - Remove actual credentials from `.env` file
     - Generate new password hashes
     - Regenerate Firebase API key (exposed in git history)

---

### 🟠 High Severity - Architecture (6)

1. **Mega-Components Need Splitting**
   - `BookingWizard.jsx` (1,122 lines) - Split into step components
   - `StaffOrderForm.jsx` (821 lines) - Extract vehicle/location components

2. **Triple-Duplicated Auth Contexts**
   - Consolidate into single role-based auth system
   - Reduces maintenance burden by ~200 lines

3. **No Code Sharing in Monorepo**
   - Create `packages/shared` for common utilities
   - Move constants (WhatsApp number, emirates, vehicle types)

4. **85% Test Coverage Missing**
   - Add tests for BookingWizard
   - Add tests for auth flows
   - Add integration tests

5. **No Memoization/Performance**
   - Add React.memo() to expensive components
   - Add useMemo/useCallback where needed
   - Implement code splitting with React.lazy()

6. **Inconsistent Error Handling**
   - Add user-facing error feedback for silent failures
   - Implement retry mechanisms

---

### 🟡 Medium Severity - UX/Features (22)

#### Notifications (5)
1. No booking confirmation email/SMS
2. No reminder before scheduled booking
3. No status update notifications
4. No push notifications (no service worker)
5. WhatsApp-only communication

#### Booking Features (5)
1. No booking receipt/PDF export
2. Guest users can't track bookings after session expires
3. Can't modify package on existing booking
4. No duplicate booking prevention
5. Confusing rescheduling flow

#### Loyalty Program (4)
1. No "Use Free Wash" button
2. No loyalty tiers (Bronze/Silver/Gold)
3. No loyalty history
4. No referral rewards

#### Mobile & RTL (3)
1. RTL arrow flipping incomplete
2. No mobile-specific breakpoints
3. Touch targets may be too small

#### Accessibility (3)
1. Wizard progress lacks `aria-current="step"`
2. Modal missing `role="dialog"`
3. Color-only status indicators

#### PWA/Offline (2)
1. No service worker
2. No offline queue for bookings

---

### 🟢 Low Severity - Nice to Have (5)

1. Service add-ons (interior vacuum, wax, tire shine)
2. Discount/coupon system
3. Admin analytics dashboard
4. Staff scheduling interface
5. Multiple location support

---

## Migration Steps for Security Updates

### 1. Generate Session Secret
```bash
# On Unix/Mac:
openssl rand -hex 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Generate Password Hashes
```javascript
// In browser console on running app:
const { hashPassword } = await import('./utils/secureSession.js');

// For manager:
await hashPassword('YourManagerPassword', 'manager@3on.ae');

// For staff:
await hashPassword('StaffPassword1', 'car1@3on.ae');
await hashPassword('StaffPassword2', 'car2@3on.ae');
```

### 3. Update .env File
```env
VITE_SESSION_SECRET=<generated-secret>
VITE_MANAGER_PASSWORD_HASH=<generated-hash>
VITE_STAFF_CREDENTIALS='[{"email":"car1@3on.ae","passwordHash":"<hash>","name":"Vehicle 1"}]'
```

### 4. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 5. Clear Old Sessions
Users with old sessions will need to log in again after deployment.

---

## Files Changed in This Update

| File | Change Type |
|------|-------------|
| `apps/web/src/utils/secureSession.js` | **NEW** - Crypto utilities |
| `apps/web/src/contexts/StaffAuthContext.jsx` | Modified - Secure auth |
| `apps/web/src/contexts/ManagerAuthContext.jsx` | Modified - Secure auth |
| `apps/web/src/contexts/AuthContext.jsx` | Modified - Signed guest sessions |
| `firestore.rules` | Modified - Stricter validation |
| `apps/web/.env.example` | Modified - Security docs |

---

## Testing the Security Updates

### Test Password Hashing
```javascript
// Should work with hashed password
await staffLogin('car1@3on.ae', 'CorrectPassword');

// Should fail with wrong password
await staffLogin('car1@3on.ae', 'WrongPassword');
```

### Test Session Tampering
```javascript
// Manually modify localStorage - should fail on next validation
localStorage.setItem('staff_session', 'tampered-data');
// Refresh page - user should be logged out
```

### Test Rate Limiting
```javascript
// After 5 failed attempts, should be locked out
for (let i = 0; i < 6; i++) {
  await staffLogin('car1@3on.ae', 'wrong');
}
// Should show "Too many failed attempts. Please wait X seconds."
```

### Test Guest Session
```javascript
// Guest session should be signed
await enterGuestMode();
// Check localStorage - should contain signed token, not plain JSON
console.log(localStorage.getItem('guest_session'));
```

---

## Priority Order for Remaining Work

1. **Immediate:** Remove credentials from actual `.env` file
2. **This Week:** Deploy Firestore rules to production
3. **Next Sprint:** Split mega-components for testability
4. **Future:** Implement notification system
