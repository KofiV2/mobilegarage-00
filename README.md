# 3ON Mobile Car Wash 🚗✨

A complete mobile car wash booking platform for the UAE market, featuring a React web application, Expo mobile app, and Firebase backend.

## Overview

3ON Mobile Car Wash is a full-stack booking system that allows customers to schedule car wash services at their location. The platform supports multiple vehicle types, service packages, and payment methods tailored for the UAE market.

### Key Features

- **Multi-platform**: React 19 web app + Expo React Native mobile app
- **Service Packages**: Platinum, Titanium, and Diamond wash packages
- **Vehicle Types**: Sedan, SUV, Motorcycle, Caravan, and Boat
- **UAE-focused**: Support for all 7 emirates, UAE phone number validation
- **Role-based Auth**: Customer, Staff, and Manager roles via Firebase
- **Notifications**: Email and Telegram notifications for new orders
- **i18n Ready**: English and Arabic localization support
- **Payment Integration**: Cash, Card, and Payment Link options

## Project Structure

```
carwash-00/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── web/             # React 19 + Vite web app
├── packages/
│   └── shared/          # Shared types, config, and utilities
├── functions/           # Firebase Cloud Functions
├── docs/                # Additional documentation
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
└── package.json         # Root workspace configuration
```

## Quick Start

### Prerequisites

- Node.js 20+
- npm 9+
- Firebase CLI (`npm i -g firebase-tools`)
- Expo CLI (`npm i -g expo-cli`) - for mobile development

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd carwash-00
npm install

# Install all workspace packages
npm run install-all
```

### Running the Web App

```bash
npm run web
# Opens at http://localhost:5173
```

### Running the Mobile App

```bash
npm run mobile
# Starts Expo development server
```

### Running Firebase Functions Locally

```bash
cd functions
npm install
npm run serve
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run web` | Start web dev server |
| `npm run mobile` | Start Expo dev server |
| `npm run test` | Run web app tests |
| `npm run typecheck` | Type-check shared package |
| `npm run typecheck:all` | Type-check all packages |
| `npm run install-all` | Install all workspace deps |

## Tech Stack

### Frontend (Web)
- React 19
- Vite 7
- React Router 7
- i18next
- Firebase SDK

### Mobile
- Expo SDK 54
- React Native 0.81
- Expo Router
- React Native Paper
- Stripe React Native

### Backend
- Firebase Cloud Functions
- Firebase Authentication
- Firestore Database
- Nodemailer (email notifications)
- Telegram Bot API

### Shared Package
- TypeScript
- Platform-agnostic types and utilities

## Service Packages

| Package | Sedan | SUV | Motorcycle |
|---------|-------|-----|------------|
| Platinum 🥈 | 45 AED | 50 AED | 30 AED |
| Titanium 🏆 | 75 AED | 80 AED | 50 AED |
| Diamond 💎 | 110 AED | 120 AED | — |

*Caravan and Boat pricing varies by size (small/medium/large)*

## Booking Flow

```
pending → confirmed → on_the_way → in_progress → completed
              ↓           ↓             ↓
           cancelled   cancelled     cancelled
```

## Documentation

- [API Documentation](./docs/API.md) - Firebase Functions reference
- [Shared Package](./docs/SHARED.md) - Types and utilities
- [Environment Variables](./docs/ENV.md) - Configuration guide
- [Contributing](./CONTRIBUTING.md) - Development guidelines

## Environment Setup

Copy the example environment files and configure:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

See [Environment Variables](./docs/ENV.md) for full configuration reference.

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Phone & Email)
3. Create a Firestore database
4. Deploy functions: `cd functions && npm run deploy`

## Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
cd apps/web && npm run test:ui

# Run E2E tests
cd apps/web && npm run test:e2e
```

## Deployment

### Web App (Vercel)
```bash
cd apps/web
vercel --prod
```

### Firebase Functions
```bash
cd functions
npm run deploy
```

### Mobile App
```bash
cd apps/mobile
eas build --platform all
```

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with ❤️ for the UAE market
