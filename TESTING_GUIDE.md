# Testing Guide - In and Out Car Wash System

## Overview

This document provides comprehensive testing guidelines for the car wash management system. The system now has full test coverage across API, web, and mobile applications.

## Table of Contents

- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Testing Stack

### API Testing (Backend)
- **Framework**: Jest
- **HTTP Testing**: Supertest
- **Coverage**: Istanbul (via Jest)
- **Mocking**: Jest mocks

### Web Testing (Frontend)
- **Framework**: Vitest
- **Component Testing**: React Testing Library
- **DOM Environment**: jsdom
- **Coverage**: Vitest Coverage (V8)

### Mobile Testing
- **Framework**: Jest (React Native preset)
- **Component Testing**: React Native Testing Library
- **Coverage**: Istanbul

## Running Tests

### API Tests

```bash
# Run all tests
cd apps/api
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Run with coverage
npm test -- --coverage
```

### Web Tests

```bash
# Run all tests
cd apps/web
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage
```

### Mobile Tests

```bash
# Run all tests
cd apps/mobile
npm test

# Run with coverage
npm test -- --coverage
```

### Run All Tests

```bash
# From root directory
npm run test:all
```

## Test Structure

### API Tests (`apps/api/src/__tests__/`)

```
__tests__/
├── models/
│   ├── User.test.js           # User model unit tests
│   ├── Booking.test.js        # Booking model unit tests
│   ├── Service.test.js        # Service model unit tests
│   └── Vehicle.test.js        # Vehicle model unit tests
├── routes/
│   ├── auth.test.js           # Auth routes tests
│   ├── bookings.test.js       # Booking routes tests
│   └── payments.test.js       # Payment routes tests
├── middleware/
│   ├── auth.test.js           # Auth middleware tests
│   ├── security.test.js       # Security middleware tests
│   └── rateLimiter.test.js    # Rate limiter tests
└── integration/
    ├── auth.test.js           # Auth flow integration tests
    ├── booking.test.js        # Booking flow integration tests
    └── payment.test.js        # Payment flow integration tests
```

### Web Tests (`apps/web/src/__tests__/`)

```
__tests__/
├── components/
│   ├── Navbar.test.jsx        # Navbar component tests
│   ├── LoadingSpinner.test.jsx
│   └── ErrorMessage.test.jsx
├── pages/
│   ├── Login.test.jsx         # Login page tests
│   ├── Register.test.jsx      # Register page tests
│   └── BookingDetails.test.jsx
└── hooks/
    └── useAuth.test.js        # Custom hooks tests
```

## Writing Tests

### API Unit Tests Example

```javascript
// apps/api/src/__tests__/models/User.test.js
const User = require('../../models/User');

describe('User Model', () => {
  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };

      // Mock implementation
      jest.spyOn(User, 'findByEmail').mockResolvedValue(mockUser);

      const result = await User.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      jest.spyOn(User, 'findByEmail').mockResolvedValue(null);

      const result = await User.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});
```

### API Integration Tests Example

```javascript
// apps/api/src/__tests__/integration/auth.test.js
const request = require('supertest');
const app = require('../../index');

describe('Auth Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });
  });
});
```

### React Component Tests Example

```javascript
// apps/web/src/__tests__/components/Navbar.test.jsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';

describe('Navbar Component', () => {
  it('should render navigation links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
  });

  it('should show login button when not authenticated', () => {
    render(
      <BrowserRouter>
        <Navbar isAuthenticated={false} />
      </BrowserRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
```

## Test Coverage

### Coverage Thresholds

We maintain the following coverage thresholds:

| Metric | Threshold |
|--------|-----------|
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |

### Viewing Coverage Reports

After running tests with coverage:

```bash
# API
cd apps/api
open coverage/index.html

# Web
cd apps/web
open coverage/index.html
```

### Coverage Configuration

Coverage is configured in:
- API: `apps/api/jest.config.js`
- Web: `apps/web/vitest.config.js`

## CI/CD Integration

### GitHub Actions Workflow

The testing is integrated into the CI/CD pipeline (`.github/workflows/ci.yml`):

```yaml
- name: Run API Tests
  run: |
    cd apps/api
    npm test -- --coverage

- name: Run Web Tests
  run: |
    cd apps/web
    npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./apps/api/coverage/lcov.info,./apps/web/coverage/lcov.info
```

### Pre-commit Hooks

Tests run automatically before commits using Husky:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

## Best Practices

### General

1. **Test Naming**: Use descriptive test names that explain what is being tested
   ```javascript
   it('should return 400 when email is invalid', () => {})
   ```

2. **Test Independence**: Each test should be independent and not rely on others
   ```javascript
   beforeEach(() => {
     // Reset state before each test
   });
   ```

3. **Mock External Dependencies**: Always mock database calls, API calls, and external services
   ```javascript
   jest.mock('../../config/supabase');
   ```

4. **Test Both Success and Failure Cases**: Cover happy paths and error scenarios
   ```javascript
   describe('login', () => {
     it('should login with valid credentials', () => {});
     it('should fail with invalid credentials', () => {});
   });
   ```

### API Testing

1. **Use Supertest for Route Testing**: Test full HTTP request/response cycle
2. **Mock Database Connections**: Don't hit real database in tests
3. **Test Middleware**: Test authentication, validation, and security middleware
4. **Test Error Handling**: Verify proper error responses

### Frontend Testing

1. **Test User Interactions**: Use `userEvent` from Testing Library
2. **Test Accessibility**: Check for proper ARIA labels and roles
3. **Test Loading States**: Verify loading spinners and skeletons
4. **Test Error States**: Verify error message display

### Integration Testing

1. **Test Complete Workflows**: Test full user journeys (register → login → book service)
2. **Test Edge Cases**: Test boundary conditions and unusual inputs
3. **Test Authentication Flows**: Verify token handling and protected routes
4. **Test Payment Processing**: Mock payment gateways and test success/failure

## Test Data

### Mocking

Use consistent mock data across tests:

```javascript
// test/fixtures/users.js
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer'
};

export const mockAdmin = {
  id: 2,
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin'
};
```

### Test Database

For integration tests, use a separate test database:

```javascript
// test/setup.js
beforeAll(async () => {
  // Connect to test database
  await connectToTestDB();
});

afterAll(async () => {
  // Cleanup and disconnect
  await cleanupTestDB();
});
```

## Debugging Tests

### Enable Verbose Output

```bash
# Jest
npm test -- --verbose

# Vitest
npm test -- --reporter=verbose
```

### Debug Single Test

```bash
# Run specific test file
npm test User.test.js

# Run specific test case
npm test -- -t "should find user by email"
```

### Debug in VSCode

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Performance Testing

### Load Testing

Use Artillery for load testing:

```bash
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### Memory Leak Detection

```bash
# Run tests with memory profiling
node --expose-gc node_modules/.bin/jest --logHeapUsage
```

## Security Testing

### Vulnerability Scanning

```bash
# Run npm audit
npm audit

# Fix vulnerabilities
npm audit fix
```

### OWASP ZAP Integration

Configure OWASP ZAP for automated security testing in CI/CD.

## Continuous Improvement

1. **Monitor Coverage Trends**: Track coverage over time
2. **Review Failed Tests**: Analyze and fix failing tests promptly
3. **Update Tests**: Keep tests updated with code changes
4. **Refactor Tests**: Improve test quality and maintainability
5. **Add New Tests**: Continuously add tests for new features

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For testing questions or issues:
- Review this guide
- Check test examples in codebase
- Consult team members
- Open an issue in the repository
