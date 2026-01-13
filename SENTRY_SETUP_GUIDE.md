# 🔍 Sentry Error Tracking - Setup Guide

**Status**: ✅ **Integrated and Ready**
**Time to Setup**: 15 minutes
**Cost**: Free tier available (10K errors/month)

---

## 📊 What is Sentry?

Sentry is a real-time error tracking platform that helps you:
- Monitor errors and crashes in production
- Get instant alerts when things break
- See detailed error reports with stack traces
- Track performance issues
- Replay user sessions to debug issues

---

## ✅ What's Already Done

### Frontend Integration ✅
- ✅ `@sentry/react` package installed
- ✅ `apps/web/src/utils/sentry.js` - Complete configuration
- ✅ `apps/web/src/main.jsx` - Sentry initialized
- ✅ Error boundaries integrated
- ✅ Performance monitoring ready
- ✅ Session replay configured
- ✅ User context tracking

### Backend Integration ✅
- ✅ `@sentry/node` package installed
- ✅ `apps/api/src/utils/sentry.js` - Complete configuration
- ✅ Request handler middleware ready
- ✅ Error handler middleware ready
- ✅ User context tracking
- ✅ Breadcrumb logging

---

## 🚀 Setup Instructions

### Step 1: Create Sentry Account (5 minutes)

1. Go to https://sentry.io
2. Sign up for free account
3. Create a new project:
   - Choose "React" for frontend
   - Choose "Express" for backend
   - Name: "CarWash Web" and "CarWash API"

### Step 2: Get Your DSN Keys (2 minutes)

After creating projects, you'll see:
```
DSN: https://xxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/123456
```

Copy both DSN keys (one for web, one for API).

### Step 3: Add to Environment Variables (3 minutes)

**Frontend (.env)**
```env
# apps/web/.env
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
VITE_ENABLE_SENTRY=true
VITE_APP_VERSION=1.0.0
```

**Backend (.env)**
```env
# apps/api/.env
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
ENABLE_SENTRY=true
NODE_ENV=production
```

### Step 4: Test Integration (5 minutes)

**Frontend Test**:
```javascript
// In browser console
window.Sentry.captureException(new Error('Test error'));
```

**Backend Test**:
```javascript
// In any API route
const { captureError } = require('./utils/sentry');
captureError(new Error('Test API error'));
```

Check Sentry dashboard - you should see the errors appear within seconds.

---

## 📝 Configuration Options

### Frontend Configuration

The frontend Sentry is already configured with:

```javascript
{
  // Performance monitoring
  tracesSampleRate: 0.1, // 10% in production

  // Session replay
  replaysSessionSampleRate: 0.1, // 10% of normal sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions

  // Filters
  beforeSend: (event) => {
    // Filters out network errors and known issues
    // Customize in apps/web/src/utils/sentry.js
  }
}
```

### Backend Configuration

The backend Sentry is already configured with:

```javascript
{
  // Performance monitoring
  tracesSampleRate: 0.1, // 10% in production

  // Request tracking
  requestHandler: true,
  errorHandler: true,

  // Filters
  beforeSend: (event) => {
    // Filters out JWT errors and validation errors
    // Customize in apps/api/src/utils/sentry.js
  }
}
```

---

## 🎯 Usage Examples

### Frontend Usage

#### 1. Manual Error Capture
```javascript
import { captureError } from './utils/sentry';

try {
  // Your code
} catch (error) {
  captureError(error, { context: 'payment processing' });
}
```

#### 2. Capture Messages
```javascript
import { captureMessage } from './utils/sentry';

captureMessage('Important event happened', 'info');
```

#### 3. Set User Context
```javascript
import { setUser } from './utils/sentry';

// After login
setUser(user);

// After logout
clearUser();
```

#### 4. Add Breadcrumbs
```javascript
import { addBreadcrumb } from './utils/sentry';

addBreadcrumb('User clicked payment button', 'ui', 'info', {
  amount: 100,
  currency: 'AED'
});
```

### Backend Usage

#### 1. In Routes
```javascript
const { captureError, addBreadcrumb } = require('../utils/sentry');

router.post('/bookings', async (req, res) => {
  try {
    addBreadcrumb('Creating booking', 'booking', 'info', {
      userId: req.user.id,
      serviceId: req.body.serviceId
    });

    const booking = await createBooking(req.body);
    res.json(booking);
  } catch (error) {
    captureError(error, {
      endpoint: '/bookings',
      userId: req.user?.id,
      body: req.body
    });
    res.status(500).json({ message: 'Failed to create booking' });
  }
});
```

#### 2. In Middleware
```javascript
const { captureUserMiddleware } = require('./utils/sentry');

// After auth middleware
app.use(captureUserMiddleware);
```

#### 3. In Error Handler
```javascript
const { errorHandler } = require('./utils/sentry');

// Add AFTER all routes
app.use(errorHandler());
```

---

## 🎛️ Sentry Dashboard Features

### 1. Issues
- See all errors grouped by type
- Filter by environment, release, user
- View stack traces
- See affected users count

### 2. Performance
- Track slow API endpoints
- Monitor page load times
- Identify bottlenecks
- Set up performance alerts

### 3. Replays
- Watch user sessions
- See exactly what user did before error
- Debug UI issues visually
- Privacy-focused (masks sensitive data)

### 4. Releases
- Track errors by version
- See regression detection
- Monitor deployment health
- Set up deploy notifications

### 5. Alerts
- Email on critical errors
- Slack integration
- PagerDuty integration
- Custom alert rules

---

## 📊 Monitoring Best Practices

### 1. Filter Noise
```javascript
// Don't track expected errors
beforeSend(event, hint) {
  const error = hint.originalException;

  // Skip network errors (user's internet issue)
  if (error?.message?.includes('Network Error')) {
    return null;
  }

  // Skip 401 errors (normal auth failures)
  if (error?.status === 401) {
    return null;
  }

  return event;
}
```

### 2. Add Context
```javascript
// Always add context to errors
captureError(error, {
  operation: 'payment_processing',
  paymentId: payment.id,
  amount: payment.amount,
  userId: user.id
});
```

### 3. Use Breadcrumbs
```javascript
// Track user actions leading to error
addBreadcrumb('User selected service', 'navigation');
addBreadcrumb('User entered card details', 'input');
addBreadcrumb('User clicked pay button', 'ui.click');
// Then error occurs - Sentry shows all breadcrumbs
```

### 4. Set Release Versions
```javascript
// In package.json
"version": "1.2.3"

// Sentry will track errors by release
```

---

## 🔐 Security & Privacy

### What Sentry Captures:
- ✅ Error messages and stack traces
- ✅ HTTP request info (URL, method, headers)
- ✅ User ID and email (for context)
- ✅ Browser/device info
- ✅ Breadcrumbs (user actions)

### What Sentry DOESN'T Capture:
- ❌ Passwords (automatically scrubbed)
- ❌ Credit card numbers (automatically scrubbed)
- ❌ API keys (automatically scrubbed)
- ❌ Session tokens (filtered out)

### Additional Privacy:
```javascript
// Session replay masks all text by default
new Sentry.Replay({
  maskAllText: true,      // Hide all text
  blockAllMedia: true,    // Hide images/videos
})
```

---

## 💰 Pricing

### Free Tier (Recommended for Start)
- 10,000 errors per month
- 100 replays per month
- 30-day data retention
- Basic integrations

### Team Plan ($26/month)
- 50,000 errors per month
- Unlimited replays
- 90-day data retention
- All integrations
- Priority support

### Business Plan ($80/month)
- 100,000+ errors per month
- Advanced features
- SSO
- SLA

**Recommendation**: Start with free tier, upgrade if needed.

---

## 🚨 Alert Configuration

### Recommended Alerts:

1. **Critical Errors**
   - Trigger: Any error with tag `critical`
   - Action: Email + Slack immediately
   - Frequency: Every time

2. **High Error Rate**
   - Trigger: >10 errors in 5 minutes
   - Action: Email team
   - Frequency: Once per hour

3. **New Issues**
   - Trigger: First occurrence of error
   - Action: Email admin
   - Frequency: Once

4. **Performance Degradation**
   - Trigger: API response time >2s
   - Action: Email devops
   - Frequency: Once per hour

---

## 📱 Mobile App Integration

For React Native mobile app:

```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

Then add DSN to app config.

---

## 🧪 Testing Checklist

- [ ] Frontend errors appear in Sentry dashboard
- [ ] Backend errors appear in Sentry dashboard
- [ ] User context is captured (after login)
- [ ] Breadcrumbs are recorded
- [ ] Session replays work (frontend)
- [ ] Performance monitoring active
- [ ] Alerts configured
- [ ] Filters working (no noise)

---

## 🐛 Troubleshooting

### Sentry Not Capturing Errors

**Issue**: Errors not appearing in dashboard

**Solutions**:
1. Check DSN is correct in .env
2. Verify ENABLE_SENTRY=true
3. Check network tab for Sentry requests
4. Look for Sentry initialization message in console
5. Test with manual error: `Sentry.captureException(new Error('test'))`

### Too Many Errors

**Issue**: Hitting rate limits

**Solutions**:
1. Add filters in beforeSend
2. Filter out network errors
3. Filter out validation errors
4. Increase sample rate (reduce from 1.0 to 0.1)

### Missing User Context

**Issue**: Errors don't show which user

**Solutions**:
1. Call `setUser(user)` after login
2. Add `captureUserMiddleware` to backend
3. Verify user object has id, email fields

---

## 📚 Additional Resources

- **Sentry Docs**: https://docs.sentry.io
- **React Integration**: https://docs.sentry.io/platforms/javascript/guides/react/
- **Node Integration**: https://docs.sentry.io/platforms/node/
- **Best Practices**: https://docs.sentry.io/product/best-practices/

---

## ✅ Next Steps

1. **Create Sentry account** (5 min)
2. **Add DSN to .env files** (3 min)
3. **Test integration** (5 min)
4. **Configure alerts** (10 min)
5. **Monitor for a week** (passive)
6. **Adjust filters** (10 min)

**Total Time**: 30-40 minutes for complete setup

---

**Status**: ✅ Code integrated, needs configuration only
**Priority**: High (critical for production monitoring)
**Difficulty**: Easy (just add DSN keys)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
