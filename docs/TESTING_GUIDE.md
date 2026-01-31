# Testing Guide

Comprehensive testing documentation for the 3ON Mobile Carwash application.

---

## Table of Contents

- [Overview](#overview)
- [Unit Testing with Vitest](#unit-testing-with-vitest)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)

---

## Overview

The project uses a comprehensive testing strategy:

- **Unit Tests**: Vitest + React Testing Library for component and utility testing
- **E2E Tests**: Playwright for end-to-end user journey testing
- **Coverage**: Code coverage reporting with v8

### Test File Structure

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.jsx
│   │   └── ErrorBoundary.test.jsx      # Unit tests
│   ├── utils/
│   │   ├── errorRecovery.js
│   │   └── errorRecovery.test.js       # Unit tests
│   └── test/
│       ├── setup.js                     # Test configuration
│       └── testUtils.jsx                # Test helpers
├── e2e/
│   ├── landing.e2e.js                   # E2E tests
│   └── error-pages.e2e.js               # E2E tests
├── vitest.config.js                     # Unit test config
└── playwright.config.js                 # E2E test config
```

---

## Unit Testing with Vitest

### Configuration

Unit tests are configured in `vitest.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
```

### Test Utilities

Custom utilities are available in `src/test/testUtils.jsx`:

```javascript
import { renderWithProviders, mockUser, mockBooking } from './test/testUtils';

// Render with all providers
const { getByText } = renderWithProviders(<MyComponent />);

// Use mock data
const user = mockUser;
const booking = mockBooking;
```

### Available Mocks

- `mockUser`: Test user object
- `mockUserData`: Complete user data
- `mockBooking`: Test booking data
- `mockLoyalty`: Loyalty program data
- `mockFirestore`: Firebase Firestore mocks
- `mockAuthContext`: Auth context mocks
- `mockToast`: Toast notification mocks
- `mockConfirm`: Confirmation dialog mocks

### Example Unit Test

```javascript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/testUtils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders successfully', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyComponent />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

---

## E2E Testing with Playwright

### Configuration

E2E tests are configured in `playwright.config.js`:

- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Base URL**: http://localhost:5173
- **Auto-start**: Dev server starts automatically
- **Retries**: 2 retries in CI, 0 in local
- **Reports**: HTML, JSON, and list formats

### Example E2E Test

```javascript
import { test, expect } from '@playwright/test';

test.describe('User Journey', () => {
  test('complete booking flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /book/i }).click();
    await expect(page).toHaveURL(/\/auth/);
    // ... continue flow
  });
});
```

### Best Practices

1. **Use Page Object Model** for complex pages
2. **Wait for elements** using Playwright's auto-waiting
3. **Test critical user journeys** end-to-end
4. **Use meaningful test names** describing the scenario
5. **Take screenshots** on failures (automatic)

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run with UI (visual test runner)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests headless
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

### Run Specific Tests

```bash
# Run specific test file
npx vitest src/components/Toast.test.jsx

# Run tests matching pattern
npx vitest --grep="ErrorBoundary"

# Run specific E2E test
npx playwright test e2e/landing.e2e.js

# Run E2E tests for specific browser
npx playwright test --project=chromium
```

---

## Writing Tests

### Unit Test Template

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/testUtils';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should render correctly', () => {
    renderWithProviders(<ComponentName />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const mockFn = vi.fn();

    renderWithProviders(<ComponentName onClick={mockFn} />);

    await user.click(screen.getByRole('button'));
    expect(mockFn).toHaveBeenCalled();
  });

  it('should show loading state', async () => {
    renderWithProviders(<ComponentName isLoading={true} />);

    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Test Template

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete user flow', async ({ page }) => {
    // Navigate
    await page.getByRole('link', { name: /services/i }).click();

    // Interact
    await page.getByRole('button', { name: /select/i }).click();

    // Assert
    await expect(page).toHaveURL(/\/booking/);
    await expect(page.getByText(/selected/i)).toBeVisible();
  });

  test('should handle errors', async ({ page }) => {
    // Trigger error condition
    await page.route('**/api/**', route => route.abort());

    await page.getByRole('button', { name: /submit/i }).click();

    // Verify error message
    await expect(page.getByText(/error/i)).toBeVisible();
  });
});
```

---

## Test Coverage

### Current Coverage Thresholds

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Viewing Coverage

```bash
# Generate and open coverage report
npm run test:coverage
open coverage/index.html
```

### Coverage Reports

Reports are generated in:
- **HTML**: `coverage/index.html` (interactive)
- **JSON**: `coverage/coverage-final.json`
- **LCOV**: `coverage/lcov.info` (for CI tools)

### Excluded from Coverage

- `node_modules/`
- `src/test/`
- `**/*.config.js`
- `**/dist/**`

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Pre-commit Hooks

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests before commit
npm run test:run
```

---

## Testing Checklist

### Before Committing

- [ ] All unit tests pass
- [ ] Code coverage meets thresholds
- [ ] E2E tests pass for critical flows
- [ ] No test warnings or errors
- [ ] Mock data is realistic
- [ ] Test names are descriptive

### Component Testing

- [ ] Renders without errors
- [ ] Props are validated
- [ ] User interactions work
- [ ] Loading states are tested
- [ ] Error states are tested
- [ ] Accessibility is tested

### Utility Testing

- [ ] Happy path works
- [ ] Edge cases handled
- [ ] Errors are caught
- [ ] Return values are correct
- [ ] Side effects are tested

### E2E Testing

- [ ] Critical user journeys work
- [ ] Form validation works
- [ ] Navigation works
- [ ] Error handling works
- [ ] Mobile responsive

---

## Common Testing Patterns

### Testing Async Operations

```javascript
it('fetches data on mount', async () => {
  const mockData = { name: 'Test' };
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockData)
  });

  renderWithProviders(<Component />);

  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Testing Error States

```javascript
it('shows error message on failure', async () => {
  vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Failed'));

  renderWithProviders(<Component />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Testing with Router

```javascript
it('navigates to detail page', async () => {
  const user = userEvent.setup();

  renderWithProviders(<Component />);

  await user.click(screen.getByText('View Details'));

  await waitFor(() => {
    expect(window.location.pathname).toBe('/details');
  });
});
```

---

## Troubleshooting

### Tests Not Found

```bash
# Ensure test files match pattern
# Unit tests: *.test.jsx or *.spec.jsx
# E2E tests: *.e2e.js

# Check vitest.config.js include pattern
include: ['src/**/*.{test,spec}.{js,jsx}']
```

### Firebase Mocking Issues

```javascript
// Ensure Firebase is mocked in setup.js
vi.mock('../firebase/config', () => ({
  auth: {},
  db: {},
}));
```

### Playwright Connection Errors

```bash
# Ensure dev server is running
npm run dev

# Or let Playwright start it
# (configured in playwright.config.js)
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial testing infrastructure setup |

---

*Happy Testing! 🧪*
