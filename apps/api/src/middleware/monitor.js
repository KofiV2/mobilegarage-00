const logger = require('../utils/logger');

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  req._startTime = process.hrtime();

  const originalSend = res.send;
  res.send = function(data) {
    const diff = process.hrtime(req._startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    // Log slow requests (> 1000ms)
    if (parseFloat(responseTime) > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        userId: req.user?.id
      });
    }

    // Add response time header
    res.setHeader('X-Response-Time', `${responseTime}ms`);

    originalSend.call(this, data);
  };

  next();
};

// Error rate monitoring
let errorCount = 0;
let requestCount = 0;
const ERROR_THRESHOLD = 0.1; // 10% error rate

const errorRateMonitor = () => {
  setInterval(() => {
    if (requestCount > 100) {
      const errorRate = errorCount / requestCount;
      if (errorRate > ERROR_THRESHOLD) {
        logger.error('High error rate detected', {
          errorRate: `${(errorRate * 100).toFixed(2)}%`,
          errors: errorCount,
          requests: requestCount
        });
      }
    }
    // Reset counters
    errorCount = 0;
    requestCount = 0;
  }, 60000); // Every minute
};

// Track requests and errors
const trackMetrics = (req, res, next) => {
  requestCount++;

  res.on('finish', () => {
    if (res.statusCode >= 500) {
      errorCount++;
    }
  });

  next();
};

// Health check endpoint data
const healthCheck = {
  status: 'healthy',
  uptime: process.uptime(),
  timestamp: Date.now(),
  checks: {}
};

// Update health status
const updateHealthCheck = async () => {
  try {
    // Check Supabase database connection
    const { supabaseAdmin } = require('../config/supabase');
    const { data, error } = await supabaseAdmin.from('users').select('id').limit(1);
    healthCheck.checks.database = !error ? 'healthy' : 'unhealthy';
  } catch (error) {
    healthCheck.checks.database = 'unhealthy';
    logger.error('Database health check failed', { error: error.message });
  }

  healthCheck.uptime = process.uptime();
  healthCheck.timestamp = Date.now();
  healthCheck.memory = process.memoryUsage();
  healthCheck.cpu = process.cpuUsage();
};

// Update health check every 30 seconds
setInterval(updateHealthCheck, 30000);

module.exports = {
  performanceMonitor,
  errorRateMonitor,
  trackMetrics,
  healthCheck
};
