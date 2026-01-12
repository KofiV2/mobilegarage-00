# Error Boundary Implementation Guide

## Overview

This application implements a comprehensive error boundary system to catch and handle React errors gracefully. The implementation includes two types of error boundaries:

1. **ErrorBoundary** - Main application-level error boundary
2. **RouteErrorBoundary** - Route-level error boundaries for individual pages

## Features

### Main Features

- **Graceful Error Handling** - Catches JavaScript errors anywhere in the component tree
- **User-Friendly Error Messages** - Shows friendly messages in production, detailed errors in development
- **Console Logging** - Structured error logging with context information
- **Backend Logging** - Automatic error logging to backend API in production
- **Sentry Integration** - Ready for Sentry integration (optional)
- **Error Recovery** - Multiple recovery options (Try Again, Reload, Go Back, Go Home)
- **Custom Error Messages** - Configurable titles and messages per boundary
- **Error IDs** - Sentry event IDs for issue tracking

## Architecture

```
App (ErrorBoundary - Application Level)
  └── Routes
       ├── Route 1 (RouteErrorBoundary - Route Level)
       ├── Route 2 (RouteErrorBoundary - Route Level)
       └── Route 3 (RouteErrorBoundary - Route Level)
```

### Error Boundary Hierarchy

1. **Application Level** - Wraps the entire application, catches critical errors
2. **Route Level** - Wraps individual routes, allows other routes to continue working

## Usage

### 1. ErrorBoundary (Application Level)

Used to wrap the entire application or major sections.

#### Basic Usage

```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

#### Advanced Usage

```jsx
<ErrorBoundary
  name="App"
  title="Application Error"
  message="The application has encountered an unexpected error. Please refresh the page."
  onError={(error, errorInfo, errorDetails) => {
    // Custom error handler
    console.log('Error occurred:', errorDetails);
  }}
  onReset={() => {
    // Custom reset handler
    console.log('Error boundary reset');
  }}
  showHomeButton={true}
>
  <YourApp />
</ErrorBoundary>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | string | 'Main' | Name of the error boundary (for logging) |
| `title` | string | 'Oops! Something went wrong' | Error page title |
| `message` | string | Standard message | Error page message |
| `onError` | function | undefined | Callback when error is caught |
| `onReset` | function | undefined | Callback when error is reset |
| `showHomeButton` | boolean | true | Show "Go Home" button |
| `fallback` | function | undefined | Custom fallback UI component |

#### Custom Fallback UI

```jsx
<ErrorBoundary
  fallback={({ error, errorInfo, resetError }) => (
    <div>
      <h1>Custom Error Page</h1>
      <p>{error.message}</p>
      <button onClick={resetError}>Try Again</button>
    </div>
  )}
>
  <YourApp />
</ErrorBoundary>
```

### 2. RouteErrorBoundary (Route Level)

Used to wrap individual routes or components.

#### Basic Usage

```jsx
import RouteErrorBoundary from './components/RouteErrorBoundary';

<Route
  path="/dashboard"
  element={
    <RouteErrorBoundary routeName="Dashboard">
      <Dashboard />
    </RouteErrorBoundary>
  }
/>
```

#### Advanced Usage

```jsx
<RouteErrorBoundary
  routeName="User Profile"
  onError={(error, errorInfo, errorDetails) => {
    // Custom error handler for this route
    analytics.trackError('profile_page_error', errorDetails);
  }}
>
  <UserProfile />
</RouteErrorBoundary>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `routeName` | string | Current pathname | Name of the route (for logging) |
| `onError` | function | undefined | Callback when error is caught |

## Error Logging

### Console Logging

Errors are logged to the console with structured format:

```
Error Boundary: Dashboard
  Error: TypeError: Cannot read property 'name' of undefined
  Error Info: {componentStack: "..."}
  Context: {
    boundary: "Dashboard",
    url: "http://localhost:3000/dashboard",
    timestamp: "2024-01-08T12:00:00.000Z"
  }
```

### Backend Logging

Errors are automatically sent to the backend API in production:

**Endpoint:** `POST /api/logs/error`

**Payload:**
```json
{
  "error": "TypeError: Cannot read property 'name' of undefined",
  "message": "Cannot read property 'name' of undefined",
  "stack": "Error stack trace...",
  "componentStack": "Component stack trace...",
  "errorBoundary": "Dashboard",
  "timestamp": "2024-01-08T12:00:00.000Z",
  "userAgent": "Mozilla/5.0...",
  "url": "http://localhost:3000/dashboard",
  "pathname": "/dashboard",
  "environment": "production"
}
```

### Sentry Integration

The error boundaries are ready for Sentry integration. To enable:

#### 1. Install Sentry

```bash
npm install @sentry/react
```

#### 2. Initialize Sentry

Create `apps/web/src/sentry.js`:

```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Make Sentry available globally
window.Sentry = Sentry;
```

#### 3. Import in Main Entry Point

In `apps/web/src/main.jsx`:

```javascript
import './sentry'; // Add this before other imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
```

#### 4. Add Environment Variable

In `.env` or `.env.production`:

```
VITE_SENTRY_DSN=your-sentry-dsn-here
```

#### 5. Error Boundaries Automatically Use Sentry

Once Sentry is initialized, the error boundaries will automatically:
- Send errors to Sentry
- Display Sentry event IDs in the error UI
- Show Sentry feedback dialog (in production)

## Environment Variables

```bash
# Backend API URL for error logging
VITE_API_URL=http://localhost:3000

# Enable error logging in development (optional)
VITE_ENABLE_ERROR_LOGGING=true

# Sentry DSN (optional, for Sentry integration)
VITE_SENTRY_DSN=your-sentry-dsn-here
```

## Development vs Production

### Development Mode

- Shows detailed error information
- Displays stack traces
- Displays component stack traces
- Shows error context (URL, timestamp, etc.)
- No backend logging by default (unless `VITE_ENABLE_ERROR_LOGGING=true`)

### Production Mode

- Shows user-friendly error messages
- Hides technical details
- Enables backend logging
- Shows "Report Issue" button
- Displays Sentry event ID if available

## Error Recovery Options

### 1. Try Again (Route Level)
Resets the error state and re-renders the component. Best for temporary errors.

### 2. Reload Page (Both Levels)
Performs a full page reload. Best for persistent errors.

### 3. Go Back (Route Level)
Navigates to the previous page. Best when current page is broken.

### 4. Go Home (Application Level)
Redirects to the home page. Best when the entire section is broken.

### 5. Report Issue (Production Only)
Opens Sentry feedback dialog or email client for users to report the issue.

## Testing Error Boundaries

### Create a Test Component

```jsx
function ErrorTest() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error from ErrorTest component');
  }

  return (
    <div>
      <h1>Error Boundary Test</h1>
      <button onClick={() => setShouldError(true)}>
        Trigger Error
      </button>
    </div>
  );
}
```

### Add Test Route

```jsx
<Route
  path="/test-error"
  element={
    <RouteErrorBoundary routeName="Error Test">
      <ErrorTest />
    </RouteErrorBoundary>
  }
/>
```

### Test the Error Boundary

1. Navigate to `/test-error`
2. Click "Trigger Error" button
3. Verify error boundary catches the error
4. Test recovery options

## Best Practices

### 1. Use Route-Level Boundaries for Pages

```jsx
// Good - Allows other routes to work if one fails
<Route path="/dashboard" element={
  <RouteErrorBoundary routeName="Dashboard">
    <Dashboard />
  </RouteErrorBoundary>
} />
```

### 2. Use Application-Level Boundary for the Entire App

```jsx
// Good - Catches critical errors
function App() {
  return (
    <ErrorBoundary name="App">
      <Router>
        <Routes>
          {/* routes */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### 3. Provide Meaningful Route Names

```jsx
// Good - Clear error context
<RouteErrorBoundary routeName="User Profile">
  <UserProfile />
</RouteErrorBoundary>

// Bad - Unclear context
<RouteErrorBoundary>
  <UserProfile />
</RouteErrorBoundary>
```

### 4. Use Custom Error Handlers for Analytics

```jsx
<ErrorBoundary
  onError={(error, errorInfo, errorDetails) => {
    analytics.track('error_occurred', {
      page: errorDetails.pathname,
      error: error.message,
    });
  }}
>
  <App />
</ErrorBoundary>
```

### 5. Don't Overuse Error Boundaries

```jsx
// Bad - Too many nested boundaries
<ErrorBoundary>
  <ErrorBoundary>
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  </ErrorBoundary>
</ErrorBoundary>

// Good - Strategic placement
<ErrorBoundary name="App">
  <RouteErrorBoundary routeName="Page">
    <Component />
  </RouteErrorBoundary>
</ErrorBoundary>
```

## Limitations

Error boundaries do NOT catch errors in:

1. Event handlers (use try-catch)
2. Asynchronous code (use try-catch or .catch())
3. Server-side rendering
4. Errors thrown in the error boundary itself

### Handling Event Handler Errors

```jsx
function MyComponent() {
  const handleClick = async () => {
    try {
      await doSomething();
    } catch (error) {
      console.error('Event handler error:', error);
      // Optionally show user-friendly message
      toast.error('An error occurred. Please try again.');
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Troubleshooting

### Error Boundary Not Catching Errors

1. Verify the error is in the component tree (not in event handlers)
2. Check that the error boundary wraps the component
3. Ensure you're throwing a real error (not returning null)

### Backend Logging Not Working

1. Check `VITE_API_URL` is set correctly
2. Verify the API endpoint `/api/logs/error` exists
3. Check browser console for failed requests
4. Enable logging in development: `VITE_ENABLE_ERROR_LOGGING=true`

### Sentry Not Receiving Errors

1. Verify Sentry is initialized before rendering the app
2. Check `VITE_SENTRY_DSN` is set correctly
3. Verify `window.Sentry` is available in browser console
4. Check Sentry dashboard for received events

## API Documentation

### Backend Error Logging Endpoint

If you need to create the backend endpoint:

```javascript
// apps/api/routes/logs.js
const express = require('express');
const router = express.Router();

router.post('/error', async (req, res) => {
  try {
    const {
      error,
      message,
      stack,
      componentStack,
      errorBoundary,
      timestamp,
      userAgent,
      url,
      pathname,
      environment
    } = req.body;

    // Log to your logging service (e.g., Winston, Loggly, Datadog)
    console.error('Frontend Error:', {
      error,
      message,
      stack,
      componentStack,
      errorBoundary,
      timestamp,
      userAgent,
      url,
      pathname,
      environment
    });

    // Optionally save to database
    // await ErrorLog.create({ ... });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error logging endpoint failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
```

## Summary

The error boundary system provides:

- **Resilience** - Prevents entire app crashes
- **User Experience** - Friendly error messages
- **Debugging** - Detailed error information in development
- **Monitoring** - Backend and Sentry integration
- **Recovery** - Multiple options to recover from errors
- **Flexibility** - Customizable messages and behaviors

For questions or issues, refer to the React Error Boundaries documentation: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
