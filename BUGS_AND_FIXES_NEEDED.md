# 🐛 BUGS AND FIXES NEEDED

**Last Updated**: 2026-01-13
**Status**: Known Issues & Improvements
**Priority Levels**: 🔴 Critical | 🟡 Important | 🟢 Minor | 🔵 Enhancement

---

## 📊 SUMMARY

| Priority | Count | Total Est. Time |
|----------|-------|-----------------|
| 🔴 Critical | 3 | 4-6 hours |
| 🟡 Important | 8 | 8-12 hours |
| 🟢 Minor | 12 | 6-8 hours |
| 🔵 Enhancement | 10 | 12-16 hours |
| **TOTAL** | **33** | **30-42 hours** |

---

## 🔴 CRITICAL ISSUES (Fix ASAP)

### 1. Security: JWT Token Refresh Missing

**Issue**: JWT tokens expire after 7 days, no refresh mechanism
**Impact**: Users forced to re-login every 7 days
**Priority**: 🔴 Critical
**Time**: 2-3 hours

**Current Behavior**:
- User login → JWT expires in 7 days
- After 7 days → 401 Unauthorized
- User must login again

**Fix Needed**:
```javascript
// apps/api/src/routes/auth.js
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new access token
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Store refresh token on login
const refreshToken = jwt.sign(
  { id: user.id },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '30d' }
);
```

**Environment Variables Needed**:
```env
JWT_REFRESH_SECRET=your-different-secret-here
```

---

### 2. Database: Missing Indexes on Foreign Keys

**Issue**: Slow queries on large datasets (users, bookings)
**Impact**: Page loads slow down as data grows
**Priority**: 🔴 Critical
**Time**: 1 hour

**Fix Needed**:
```sql
-- Add indexes for foreign keys
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_assigned_staff_id ON bookings(assigned_staff_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_staff_date ON bookings(assigned_staff_id, scheduled_date);
```

**Apply**:
```bash
psql $DATABASE_URL < add-indexes.sql
```

---

### 3. Payment: Webhook Signature Verification Missing

**Issue**: Stripe webhooks not verifying signatures
**Impact**: Security vulnerability - fake payment confirmations possible
**Priority**: 🔴 Critical
**Time**: 1-2 hours

**Current Code** (`apps/api/src/routes/payments-stripe.js`):
```javascript
// ⚠️ Missing signature verification
router.post('/webhook', async (req, res) => {
  const event = req.body; // ❌ Unsafe!
  // ... handle event
});
```

**Fix Needed**:
```javascript
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // ✅ Verify signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Now safe to process
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Handle payment
      break;
    // ...
  }

  res.json({ received: true });
});
```

**Setup Webhook in Stripe Dashboard**:
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-api.com/api/payments-stripe/webhook`
3. Copy webhook secret → Add to `.env`

---

## 🟡 IMPORTANT ISSUES (Fix Soon)

### 4. Auth: Password Reset Flow Missing

**Issue**: Users can't reset forgotten passwords
**Impact**: Users get locked out of accounts
**Priority**: 🟡 Important
**Time**: 3-4 hours

**Fix Needed**:
```javascript
// 1. Request password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  const user = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (!user.data) {
    // Don't reveal if email exists (security)
    return res.json({ message: 'If email exists, reset link sent' });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Save token to database (expires in 1 hour)
  await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: user.data.id,
      token_hash: resetTokenHash,
      expires_at: new Date(Date.now() + 3600000) // 1 hour
    });

  // Send email
  const resetUrl = `${process.env.WEB_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: email,
    subject: 'Password Reset',
    html: `Click here to reset: <a href="${resetUrl}">${resetUrl}</a>`
  });

  res.json({ message: 'If email exists, reset link sent' });
});

// 2. Reset password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find valid token
  const resetRecord = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .eq('used', false)
    .single();

  if (!resetRecord.data) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  // Update password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', resetRecord.data.user_id);

  // Mark token as used
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('id', resetRecord.data.id);

  res.json({ message: 'Password reset successful' });
});
```

**Database Schema**:
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token_hash);
```

---

### 5. Validation: Phone Number Not Validated

**Issue**: Users can enter invalid phone numbers
**Impact**: SMS notifications fail, bookings invalid
**Priority**: 🟡 Important
**Time**: 1 hour

**Fix Needed**:
```javascript
// Install: npm install libphonenumber-js
const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

// Validation middleware
const validatePhone = (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Phone number required' });
  }

  try {
    if (!isValidPhoneNumber(phone, 'AE')) {
      return res.status(400).json({ message: 'Invalid UAE phone number' });
    }

    // Normalize format
    const phoneNumber = parsePhoneNumber(phone, 'AE');
    req.body.phone = phoneNumber.format('E.164'); // +971501234567

    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid phone number format' });
  }
};

// Use in routes
router.post('/register', validatePhone, async (req, res) => {
  // ...
});
```

**Frontend Validation** (`apps/web/src/schemas/validationSchemas.js`):
```javascript
import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^(\+971|00971|0)?[0-9]{9}$/, 'Invalid UAE phone number')
  .transform((val) => {
    // Normalize to +971 format
    if (val.startsWith('00971')) return val.replace('00971', '+971');
    if (val.startsWith('0')) return `+971${val.slice(1)}`;
    if (!val.startsWith('+')) return `+971${val}`;
    return val;
  });
```

---

### 6. Error Handling: Error Messages Not User-Friendly

**Issue**: Technical error messages shown to users
**Impact**: Poor UX, confusing for non-technical users
**Priority**: 🟡 Important
**Time**: 2 hours

**Current**:
```
Error: foreign key constraint "fk_booking_service"
SQLSTATE: 23503
```

**Should Be**:
```
This service is no longer available. Please choose another service.
```

**Fix Needed** (`apps/api/src/middleware/errorHandler.js`):
```javascript
const errorMessages = {
  // Database errors
  '23505': 'This record already exists',
  '23503': 'Cannot delete: other records depend on this',
  '23502': 'Required field is missing',
  '23514': 'Invalid value provided',

  // Custom error codes
  'BOOKING_CONFLICT': 'This time slot is already booked',
  'INSUFFICIENT_FUNDS': 'Insufficient wallet balance',
  'INVALID_COUPON': 'This coupon code is invalid or expired',
  'SERVICE_UNAVAILABLE': 'This service is temporarily unavailable',
  'PAYMENT_FAILED': 'Payment processing failed. Please try again.',
};

const errorHandler = (err, req, res, next) => {
  // Log for debugging
  console.error('Error:', err);

  // PostgreSQL error
  if (err.code && errorMessages[err.code]) {
    return res.status(400).json({
      message: errorMessages[err.code],
      code: err.code
    });
  }

  // Custom error
  if (err.errorCode && errorMessages[err.errorCode]) {
    return res.status(err.statusCode || 400).json({
      message: errorMessages[err.errorCode],
      code: err.errorCode
    });
  }

  // Default user-friendly message
  res.status(err.statusCode || 500).json({
    message: err.userMessage || 'Something went wrong. Please try again.',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
};
```

---

### 7. Booking: No Double-Booking Prevention

**Issue**: Same time slot can be booked by multiple customers
**Impact**: Staff conflicts, service quality issues
**Priority**: 🟡 Important
**Time**: 2 hours

**Fix Needed**:
```javascript
// Before creating booking
router.post('/bookings', async (req, res) => {
  const { scheduled_date, scheduled_time, assigned_staff_id } = req.body;

  // Check for conflicts
  const conflicts = await supabase
    .from('bookings')
    .select('id')
    .eq('assigned_staff_id', assigned_staff_id)
    .eq('scheduled_date', scheduled_date)
    .eq('scheduled_time', scheduled_time)
    .in('status', ['pending', 'confirmed', 'in_progress']);

  if (conflicts.data && conflicts.data.length > 0) {
    return res.status(409).json({
      message: 'This time slot is already booked. Please choose another time.',
      errorCode: 'BOOKING_CONFLICT'
    });
  }

  // Create booking...
});
```

**Better: Add Database Constraint**:
```sql
CREATE UNIQUE INDEX idx_no_double_booking
ON bookings(assigned_staff_id, scheduled_date, scheduled_time)
WHERE status IN ('pending', 'confirmed', 'in_progress');
```

---

### 8. Security: Rate Limiting Not Configured

**Issue**: No protection against brute force attacks
**Impact**: Security vulnerability
**Priority**: 🟡 Important
**Time**: 30 minutes

**Fix Needed** (`apps/api/src/index.js`):
```javascript
const rateLimit = require('express-rate-limit');

// General rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again later',
});

// Apply to all routes
app.use('/api/', limiter);

// Apply stricter limit to auth
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

---

### 9. Email: No Retry Mechanism for Failed Emails

**Issue**: Failed emails are lost forever
**Impact**: Users don't receive important notifications
**Priority**: 🟡 Important
**Time**: 2-3 hours

**Fix Needed** (`apps/api/src/services/emailQueue.js`):
```javascript
// Already exists but needs retry logic
const emailQueue = [];
const MAX_RETRIES = 3;

const processQueue = async () => {
  for (const item of emailQueue) {
    try {
      await emailService.sendEmail(item.options);

      // Remove from queue on success
      const index = emailQueue.indexOf(item);
      emailQueue.splice(index, 1);
    } catch (error) {
      console.error('Email send failed:', error);

      // Increment retry count
      item.retries = (item.retries || 0) + 1;

      if (item.retries >= MAX_RETRIES) {
        // Log to database for manual review
        await supabase.from('failed_emails').insert({
          to: item.options.to,
          subject: item.options.subject,
          error: error.message,
          retries: item.retries,
          created_at: new Date()
        });

        // Remove from queue
        const index = emailQueue.indexOf(item);
        emailQueue.splice(index, 1);
      } else {
        // Retry with exponential backoff
        const backoff = Math.pow(2, item.retries) * 1000; // 2s, 4s, 8s
        setTimeout(() => processQueue(), backoff);
      }
    }
  }
};
```

---

### 10. UI: Loading States Missing in Some Forms

**Issue**: No feedback when submitting forms
**Impact**: Users click multiple times, duplicate submissions
**Priority**: 🟡 Important
**Time**: 1 hour

**Fix Needed**: Add loading states to all forms
```javascript
// Example: ServicesManagement.jsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleCreateService = async (data) => {
  setIsSubmitting(true);
  try {
    await api.post('/admin/services', data);
    toast.success('Service created!');
  } catch (error) {
    toast.error('Failed to create service');
  } finally {
    setIsSubmitting(false);
  }
};

// In JSX
<button
  type="submit"
  disabled={isSubmitting}
>
  {isSubmitting ? 'Creating...' : 'Create Service'}
</button>
```

**Files to Update**:
- `NewBooking.jsx`
- `ServicesManagement.jsx`
- `UsersManagement.jsx`
- `Profile.jsx`

---

### 11. Search: Case-Sensitive Search

**Issue**: Search for "JOHN" doesn't find "john"
**Impact**: Poor search experience
**Priority**: 🟡 Important
**Time**: 30 minutes

**Fix Needed** (All admin routes):
```javascript
// Before (case-sensitive)
.ilike('name', `%${searchQuery}%`)

// After (case-insensitive)
.ilike('name', `%${searchQuery.toLowerCase()}%`)

// Or use PostgreSQL's LOWER()
WHERE LOWER(name) LIKE LOWER('%${searchQuery}%')
```

---

## 🟢 MINOR ISSUES (Fix When Time Permits)

### 12. UI: Date Picker Allows Past Dates

**Issue**: Users can select yesterday for bookings
**Impact**: Validation errors after submission
**Priority**: 🟢 Minor
**Time**: 15 minutes

**Fix**: Add `min={new Date().toISOString().split('T')[0]}` to date inputs

---

### 13. UI: No Confirmation Dialog for Delete Actions

**Issue**: Users can accidentally delete important data
**Impact**: Data loss, user frustration
**Priority**: 🟢 Minor
**Time**: 1 hour

**Fix**: Add confirmation modals
```javascript
const handleDelete = (id) => {
  if (window.confirm('Are you sure? This cannot be undone.')) {
    deleteItem(id);
  }
};
```

---

### 14. UI: Success Messages Disappear Too Quickly

**Issue**: Toast notifications vanish in 2 seconds
**Impact**: Users miss confirmations
**Priority**: 🟢 Minor
**Time**: 5 minutes

**Fix**:
```javascript
// apps/web/src/App.jsx
<ToastContainer
  autoClose={5000} // Changed from 2000 to 5000
  position="top-right"
/>
```

---

### 15. Performance: Images Not Optimized

**Issue**: Large images slow down page loads
**Impact**: Poor performance on mobile
**Priority**: 🟢 Minor
**Time**: 2 hours

**Fix**:
- Use WebP format
- Add lazy loading
- Resize images on upload
- Use CDN for images

---

### 16-23. Additional Minor Issues

(Abbreviated for brevity - full list in actual implementation)

- Missing alt text on images
- Console warnings in development
- Inconsistent button styles
- Form validation messages unclear
- Mobile menu doesn't close after click
- Footer links not working
- Social media links missing
- Terms & conditions page empty

---

## 🔵 ENHANCEMENTS (Nice to Have)

### 24. Keyboard Shortcuts for Admin

**Enhancement**: Add keyboard shortcuts for common actions
**Impact**: Faster workflow for admin users
**Priority**: 🔵 Enhancement
**Time**: 2 hours

**Example**:
- `Ctrl + K`: Quick search
- `Ctrl + N`: New booking
- `Ctrl + D`: Dashboard
- `Esc`: Close modal

---

### 25-33. Additional Enhancements

(Full list available in detailed version)

- Bulk actions (select multiple, delete all)
- CSV import for users/services
- Print booking confirmations
- Barcode scanning for QR codes
- Voice search
- Accessibility improvements (ARIA labels)
- Progressive Web App (PWA) features
- Offline mode
- Auto-save drafts

---

## 📋 TESTING NEEDED

### Unit Tests (0% Coverage)

**Priority**: Important
**Time**: 20-30 hours

Areas needing tests:
- Authentication flows
- Payment processing
- Booking creation/updates
- Input validation
- RBAC permissions
- Email sending
- QR code generation

---

### Integration Tests

**Priority**: Important
**Time**: 15-20 hours

Scenarios to test:
- Complete booking flow (customer + staff)
- Payment flow end-to-end
- Email notification triggers
- Real-time updates
- Role-based access

---

### E2E Tests

**Priority**: Medium
**Time**: 10-15 hours

Use Playwright or Cypress:
- User registration → booking → payment
- Admin login → manage booking → complete
- Staff login → check-in → update status

---

## 🎯 RECOMMENDED FIX ORDER

### Week 1: Critical Fixes (8 hours)
1. JWT Refresh Token (3h)
2. Database Indexes (1h)
3. Webhook Signature Verification (2h)
4. Rate Limiting (30min)
5. Double Booking Prevention (2h)

### Week 2: Important Fixes (12 hours)
6. Password Reset (4h)
7. Phone Validation (1h)
8. Error Messages (2h)
9. Email Retry (3h)
10. Loading States (1h)
11. Case-Insensitive Search (30min)

### Week 3: Minor Fixes (8 hours)
12-23. All minor UI/UX issues

### Week 4: Testing (20 hours)
- Write unit tests
- Integration tests
- E2E tests

---

## 🧪 VERIFICATION CHECKLIST

After fixing, verify:
- [ ] JWT tokens refresh automatically
- [ ] Queries run fast (<100ms)
- [ ] Webhook signatures verified
- [ ] Password reset works
- [ ] Phone numbers validated
- [ ] Error messages user-friendly
- [ ] No double bookings possible
- [ ] Rate limiting active
- [ ] Failed emails retry
- [ ] All forms have loading states
- [ ] Search is case-insensitive
- [ ] All tests passing

---

## 📊 BUG TRACKING

Create issues in GitHub:
```bash
# Label by priority
gh issue create --title "Critical: Add JWT refresh" --label "priority:critical,bug"
gh issue create --title "Important: Add password reset" --label "priority:high,bug"
gh issue create --title "Minor: Fix date picker" --label "priority:low,bug"
```

---

**Status**: 33 issues identified, prioritized, and documented
**Total Fix Time**: 30-42 hours
**Recommendation**: Fix critical issues immediately, then work through by priority

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
