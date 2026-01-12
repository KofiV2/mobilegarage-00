require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { testConnection: testSupabaseConnection } = require('./config/supabase');
const { testConnection: testDatabaseConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http');
const { initializeWebSocket } = require('./websocket');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'Supabase PostgreSQL',
    version: '2.0'
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Car Wash API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'In and Out Car Wash API',
    version: '2.0.0',
    database: 'Supabase PostgreSQL',
    documentation: '/api-docs',
    features: [
      'Customer Management',
      'Booking System',
      'Payment Processing (Stripe, Tabby, Tamara)',
      'Staff Work Tracking',
      'Loyalty Programs',
      'AI-Powered Analytics',
      'Real-time Updates'
    ],
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api-docs',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
      }
    }
  });
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Guest Booking Routes (no auth required)
const guestBookingsRoutes = require('./routes/guest-bookings');
app.use('/api/guest-bookings', guestBookingsRoutes);

// Admin Routes
const adminDashboardRoutes = require('./routes/admin/dashboard');
const adminUsersRoutes = require('./routes/admin/users');
const adminStaffRoutes = require('./routes/admin/staff');
const adminBookingsRoutes = require('./routes/admin/bookings');
const adminServicesRoutes = require('./routes/admin/services');
const adminAnalyticsRoutes = require('./routes/admin/analytics');

app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/admin/bookings', adminBookingsRoutes);
app.use('/api/admin/services', adminServicesRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);

// Payment Routes
const paymentsStripeRoutes = require('./routes/payments-stripe');
app.use('/api/payments-stripe', paymentsStripeRoutes);

// Tracking Routes (Staff & Fleet)
const trackingRoutes = require('./routes/tracking');
app.use('/api/tracking', trackingRoutes);

// Staff Routes
const staffRoutes = require('./routes/staff');
app.use('/api/staff', staffRoutes);

// User Feature Routes
const vehiclesRoutes = require('./routes/vehicles');
const walletsRoutes = require('./routes/wallets');
const loyaltyRoutes = require('./routes/loyalty');

app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/wallets', walletsRoutes);
app.use('/api/loyalty', loyaltyRoutes);

// TODO: Saved Locations route - table needs to be created in Supabase first
// const savedLocationsRoutes = require('./routes/saved-locations');
// app.use('/api/saved-locations', savedLocationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: ['/health', '/api']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Initialize email service
const emailService = require('./services/emailService');

// Start server
const startServer = async () => {
  try {
    console.log('========================================');
    console.log('  IN AND OUT CAR WASH API');
    console.log('  Starting Server...');
    console.log('========================================');
    console.log('');

    // Test Supabase connection
    console.log('[1/3] Testing Supabase connection...');
    await testSupabaseConnection();
    console.log('');

    // Test PostgreSQL connection
    console.log('[2/3] Testing PostgreSQL connection...');
    const dbConnected = await testDatabaseConnection();

    if (!dbConnected) {
      console.warn('⚠️  Warning: Database connection failed!');
      console.warn('   Server will start but database operations may not work.');
      console.warn('   Check your .env file configuration.');
    }
    console.log('');

    // Initialize email service
    console.log('[3/3] Initializing email service...');
    await emailService.initialize();
    console.log('');

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket
    console.log('Initializing WebSocket server...');
    initializeWebSocket(server);
    console.log('WebSocket server initialized');
    console.log('');

    // Start Express server
    server.listen(PORT, () => {
      console.log('========================================');
      console.log('  SERVER STARTED SUCCESSFULLY!');
      console.log('========================================');
      console.log('');
      console.log(`  🚀 Server running on port ${PORT}`);
      console.log(`  🌐 API: http://localhost:${PORT}`);
      console.log(`  ❤️  Health: http://localhost:${PORT}/health`);
      console.log(`  📊 Info: http://localhost:${PORT}/api`);
      console.log(`  🔌 WebSocket: Ready for connections`);
      console.log('');
      console.log('  Database: Supabase PostgreSQL');
      console.log(`  Project: gyvyoejlbbnxujcaygyr`);
      console.log('');
      console.log('========================================');
      console.log('');
      console.log('  Press Ctrl+C to stop the server');
      console.log('');
    });

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('  ❌ FAILED TO START SERVER');
    console.error('========================================');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Check your .env file exists');
    console.error('  2. Verify Supabase credentials are correct');
    console.error('  3. Ensure database schema is created');
    console.error('  4. Check internet connection');
    console.error('');
    console.error('See SUPABASE_SETUP_GUIDE.md for help');
    console.error('');
    console.error('========================================');
    console.error('');

    // Don't exit, let the process stay open for debugging
    console.log('Press any key to exit...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 1));
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('');
  console.error('❌ Uncaught Exception:', error.message);
  console.error(error.stack);
  console.error('');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  console.error('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('========================================');
  console.log('  Shutting down gracefully...');
  console.log('========================================');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
