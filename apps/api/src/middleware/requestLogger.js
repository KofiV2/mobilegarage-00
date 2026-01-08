const logger = require('../utils/logger');
const morgan = require('morgan');

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

// Custom token for response time in ms
morgan.token('response-time-ms', (req, res) => {
  if (!req._startTime) return '0';
  const diff = process.hrtime(req._startTime);
  return (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
});

// Morgan stream
const stream = {
  write: (message) => logger.info(message.trim())
};

// Development format
const devFormat = ':method :url :status :response-time ms - :user-id';

// Production format (JSON)
const prodFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time-ms',
  userId: ':user-id',
  userAgent: ':user-agent',
  ip: ':remote-addr'
});

// Export middleware
const requestLogger = process.env.NODE_ENV === 'production'
  ? morgan(prodFormat, { stream })
  : morgan(devFormat, { stream });

module.exports = requestLogger;
