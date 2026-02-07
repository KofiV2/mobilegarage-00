# Security Audit Report - 3ON Mobile Carwash

**Audit Date:** 2026-02-07  
**Auditor:** Security Agent (AI-assisted audit)  
**Scope:** Environment files, Firestore rules, authentication contexts, hardcoded credentials

---

## Executive Summary

Overall security posture: **GOOD** with some **HIGH-PRIORITY** items requiring immediate attention.

| Category | Status | Priority Items |
|----------|--------|----------------|
| Environment Files | ⚠️ Warning | Real-looking credential in example file |
| Firestore Rules | ✅ Good | Minor improvements suggested |
| Hardcoded Credentials | ✅ Clean | No exposed secrets found |
| Auth Implementation | ✅ Good | Well-implemented security patterns |
| .gitignore | ✅ Good | Properly excludes sensitive files |

---

## 🔴 Critical Findings

### 1. Real-Looking Credential in .env.example

**File:** `/.env.example`  
**Severity:** HIGH  
**Status:** REQUIRES IMMEDIATE ACTION

The root `.env.example` file contains what appears to be a real database password:

```
DB_PASSWORD=CuZ3QVFthRc3ZIoK
DATABASE_URL=postgresql://postgres:CuZ3QVFthRc3ZIoK@db.your-project.supabase.co:5432/INANDOUT
```

**Risk:** Even if this is a placeholder, it follows a pattern that suggests it may have been copied from a real configuration. If this password was ever used in production, it should be rotated immediately.

**Recommendation:**
1. **IMMEDIATELY** check if this password is/was used anywhere in production
2. If yes, rotate the database password
3. Replace with clearly fake examples:
   ```
   DB_PASSWORD=your-database-password-here
   DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/your-db-name
   ```

---

## 🟡 Medium Priority Findings

### 2. Firestore Loyalty System - Potential Manipulation

**File:** `/firestore.rules` (lines 168-190)  
**Severity:** MEDIUM

The loyalty collection allows users to increment their own `washCount`:

```javascript
allow update: if isOwner(userId)
  && (request.resource.data.washCount == resource.data.washCount + 1)
```

**Risk:** Clients can self-award wash counts by manipulating the request. While the rule limits increment to +1, a malicious client could still farm free washes over time.

**Recommendation:** Move loyalty point awarding to Cloud Functions only:
```javascript
// In firestore.rules
match /loyalty/{userId} {
  allow read: if isOwner(userId) || isManager();
  allow create: if false;  // Only via Cloud Functions
  allow update: if false;  // Only via Cloud Functions
}
```

### 3. Guest Session Validation - Minimal Verification

**File:** `/firestore.rules` (lines 206-213)  
**Severity:** MEDIUM

Guest bookings rely on a 32-character session ID without server-side cryptographic verification:

```javascript
allow read: if resource.data.guestSessionId is string
            && resource.data.guestSessionId.size() >= 32;
```

**Risk:** Predictable session IDs could allow unauthorized booking access.

**Mitigation Already Present:** The web app uses HMAC-signed sessions (`secureSession.js`), but the Firestore rules don't enforce cryptographic verification.

**Recommendation:** Consider adding a server-validated token or moving guest booking retrieval through a Cloud Function.

---

## ✅ Good Security Practices Observed

### Environment Variable Usage

All apps properly use environment variables for sensitive configuration:

| App | Config Pattern | Status |
|-----|---------------|--------|
| Web (`apps/web`) | `import.meta.env.VITE_*` | ✅ |
| Mobile (`apps/mobile`) | `process.env.EXPO_PUBLIC_*` | ✅ |
| Functions (`functions`) | `process.env.*` | ✅ |

### Firebase Configuration

Both web and mobile apps load Firebase config from environment variables:

```javascript
// Web - apps/web/src/firebase/config.js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ... all from env vars
};

// Mobile - apps/mobile/firebase/config.js
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  // ... all from env vars
};
```

### Secure Session Management (Web)

The web app implements proper session security (`apps/web/src/utils/secureSession.js`):

- ✅ HMAC-SHA256 session signing
- ✅ Per-browser session secrets
- ✅ Constant-time comparison for signature verification
- ✅ Session expiry handling
- ✅ Salted password hashing (SHA-256)

### Role-Based Access Control

Firestore rules implement proper RBAC:

```javascript
function isManager() {
  return isAuthenticated() && request.auth.token.role == 'manager';
}

function isStaff() {
  return isAuthenticated() && request.auth.token.role == 'staff';
}
```

Custom claims are managed server-side via Cloud Functions with audit logging.

### Rate Limiting

Manager authentication implements client-side rate limiting:
- Maximum 5 attempts before 30-minute lockout
- Tracked in sessionStorage

### Audit Logging

Cloud Functions create audit trails for sensitive operations:
- Role changes
- Booking creation
- Staff order notifications

### .gitignore Configuration

Properly excludes sensitive files:
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
credentials.txt
*.credentials
secrets.txt
```

---

## 📋 Security Checklist for Deployment

Before deploying to production, verify:

### Environment Variables
- [ ] All `.env` files are NOT committed to git
- [ ] Production secrets are set in hosting platform (Vercel/Firebase)
- [ ] JWT_SECRET is at least 32 characters of random data
- [ ] All passwords are hashed (not plaintext) in staff credentials

### Firebase
- [ ] `firestore.rules` is deployed (run `firebase deploy --only firestore:rules`)
- [ ] Authorized domains are configured in Firebase Console
- [ ] Phone auth reCAPTCHA domains are whitelisted
- [ ] Custom claims are set for manager accounts

### Cloud Functions
- [ ] `functions/.env` secrets are set via `firebase functions:secrets:set`
- [ ] SMTP credentials are valid and tested
- [ ] Telegram bot token is configured (if using)

### Web App
- [ ] `VITE_DEMO_MODE=false` in production
- [ ] Session secret is properly generated
- [ ] Manager/staff password hashes are generated (not plaintext)

---

## 📚 Security Best Practices Reference

### Generating Secure Secrets

```bash
# Generate random JWT secret (Linux/Mac)
openssl rand -hex 32

# Generate random session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Password Hash Generation

Using the app's built-in utility (browser console):
```javascript
// In running app, open browser console:
await import('./utils/secureSession').then(m => 
  m.hashPassword('YourPassword', 'user@email.com')
)
```

### Firebase Security Rules Testing

Test rules before deployment:
```bash
firebase emulators:start --only firestore
npm run test:rules  # If configured
```

---

## 🔄 Recommended Next Steps

1. **IMMEDIATE:** Review and update `.env.example` to remove real-looking credentials
2. **HIGH:** Move loyalty point management to Cloud Functions only
3. **MEDIUM:** Add server-side validation for guest session tokens
4. **LOW:** Consider implementing proper bcrypt password hashing via backend API

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-07 | Initial security audit |

