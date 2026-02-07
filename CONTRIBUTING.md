# Contributing to 3ON Mobile Car Wash

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm 9+** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd carwash-00

# Install dependencies (all workspaces)
npm install

# Copy environment files
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env

# Start development server
npm run web
```

## Project Structure

```
carwash-00/
├── apps/
│   ├── mobile/          # Expo React Native app
│   │   ├── app/         # Expo Router screens
│   │   ├── components/  # Mobile components
│   │   └── ...
│   └── web/             # React Vite app
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   └── ...
│       └── ...
├── packages/
│   └── shared/          # Shared types & utilities
│       └── src/
│           ├── types/
│           ├── config/
│           ├── constants/
│           └── utils/
├── functions/           # Firebase Cloud Functions
└── docs/                # Documentation
```

## Workflow

### Branch Naming

- `feature/short-description` - New features
- `fix/issue-number-description` - Bug fixes
- `docs/what-changed` - Documentation updates
- `refactor/what-changed` - Code refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(booking): add recurring booking support
fix(auth): resolve phone validation for +971 numbers
docs(readme): update installation instructions
refactor(pricing): extract calculation to shared package
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm run test`
4. Run type-check: `npm run typecheck:all`
5. Push and create a PR
6. Fill out the PR template
7. Request review

## Code Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Prefer interfaces over type aliases for objects
- Use `type` for unions, intersections, and primitives
- Export types from `@3on/shared` for cross-package use

```typescript
// ✅ Good
import type { Booking, PackageId } from '@3on/shared';

interface BookingCardProps {
  booking: Booking;
  onSelect: (id: string) => void;
}

// ❌ Avoid
const booking: any = data;
```

### React Components

- Use functional components with hooks
- Prefer named exports
- Keep components focused and small
- Extract logic to custom hooks

```typescript
// ✅ Good
export function BookingCard({ booking, onSelect }: BookingCardProps) {
  const { formatPrice } = useFormatters();
  
  return (
    <div onClick={() => onSelect(booking.id)}>
      <h3>{booking.package}</h3>
      <p>{formatPrice(booking.totalPrice)}</p>
    </div>
  );
}

// ❌ Avoid
export default function(props) {
  // 300 lines of code
}
```

### Styling

**Web**: CSS Modules or inline styles (no Tailwind in current setup)

**Mobile**: React Native Paper components + StyleSheet

```typescript
// Web
import styles from './BookingCard.module.css';

// Mobile
const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
  },
});
```

### Imports

Order imports as follows:
1. React/React Native
2. Third-party libraries
3. Shared package (`@3on/shared`)
4. Local components
5. Local utilities
6. Types (using `import type`)

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { PACKAGES, calculateTotalPrice } from '@3on/shared';

import { BookingCard } from '../components/BookingCard';
import { useAuth } from '../hooks/useAuth';

import type { Booking } from '@3on/shared';
```

## Testing

### Unit Tests (Vitest)

```bash
# Run tests
npm run test

# Watch mode
cd apps/web && npm run test

# With UI
cd apps/web && npm run test:ui

# Coverage report
cd apps/web && npm run test:coverage
```

Write tests for:
- Utility functions
- Custom hooks
- Complex components

```typescript
// Example test
import { describe, it, expect } from 'vitest';
import { calculateTotalPrice } from '@3on/shared';

describe('calculateTotalPrice', () => {
  it('calculates base price correctly', () => {
    const result = calculateTotalPrice('platinum', 'sedan', null, []);
    expect(result.totalPrice).toBe(45);
  });

  it('applies subscription discount', () => {
    const result = calculateTotalPrice('platinum', 'sedan', null, [], true);
    expect(result.totalPrice).toBe(42);
  });
});
```

### E2E Tests (Playwright)

```bash
cd apps/web

# Run E2E tests
npm run test:e2e

# With UI
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# View report
npm run test:e2e:report
```

## Shared Package Development

When modifying `packages/shared`:

1. Make changes in `packages/shared/src/`
2. Run type-check: `npm run typecheck`
3. Test in consuming apps (web/mobile)
4. Update documentation in `docs/SHARED.md`

### Adding New Types

```typescript
// packages/shared/src/types/index.ts
export interface NewFeature {
  id: string;
  name: string;
}

// packages/shared/src/index.ts
export type { NewFeature } from './types';
```

### Adding New Utilities

```typescript
// packages/shared/src/utils/newUtil.ts
export function newUtility(value: string): string {
  return value.toUpperCase();
}

// packages/shared/src/index.ts
export { newUtility } from './utils/newUtil';
```

## Firebase Development

### Local Emulators

```bash
cd functions
npm run serve
```

This starts:
- Functions emulator: http://localhost:5001
- Firestore emulator: http://localhost:8080

### Adding a Cloud Function

```typescript
// functions/src/index.ts
export const myNewFunction = functions.https.onCall(async (data, context) => {
  // Validate auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }
  
  // Implement logic
  return { success: true };
});
```

### Testing Functions

```bash
cd functions

# Build
npm run build

# Shell for manual testing
npm run shell
```

## Common Tasks

### Add a New Package Option

1. Update `packages/shared/src/config/packages.ts`
2. Add translations if needed
3. Update documentation

### Add a New Vehicle Type

1. Add to `VehicleTypeId` in `packages/shared/src/types/index.ts`
2. Add config in `packages/shared/src/config/packages.ts`
3. Add pricing for all packages
4. Update UI components

### Add a New Booking Status

1. Add to `BookingStatus` type
2. Update `STATUS_ORDER` and `STATUS_FLOW`
3. Add color and icon
4. Update UI components

## Troubleshooting

### TypeScript Errors

```bash
# Clear cache and rebuild
npm run typecheck:all

# Restart TS server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Firebase Errors

```bash
# Re-authenticate
firebase login --reauth

# Check project
firebase projects:list
firebase use <project-id>
```

## Getting Help

- Check existing issues
- Read the documentation in `/docs`
- Ask in the team chat

---

Happy coding! 🚗✨
