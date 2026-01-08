#!/bin/bash

# Install Security and Infrastructure Packages
# Run this script to install all required dependencies

echo "📦 Installing security and infrastructure packages..."

# Navigate to API directory
cd apps/api

echo "🔐 Installing security packages..."
npm install --save \
  helmet \
  cors \
  express-rate-limit \
  rate-limit-redis \
  express-mongo-sanitize \
  xss-clean \
  hpp \
  speakeasy \
  qrcode \
  joi

echo "📊 Installing logging and monitoring packages..."
npm install --save \
  winston \
  morgan

echo "🔄 Installing Redis client..."
npm install --save redis

echo "🐛 Installing error tracking..."
npm install --save @sentry/node

echo "✅ All packages installed successfully!"
echo ""
echo "Next steps:"
echo "1. Update apps/api/src/index.js to import and use the new middleware"
echo "2. Add the auth-security routes to your route configuration"
echo "3. Configure environment variables in .env"
echo "4. Run: npm start"
