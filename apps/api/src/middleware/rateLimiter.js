const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const logger = require('../utils/logger');

// Create Redis client for rate limiting (optional)
let redisClient;
if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      legacyMode: true
    });
    redisClient.connect().catch(console.error);
    logger.info('Redis connected for rate limiting');
  } catch (error) {
    logger.error('Redis connection failed, using memory store', { error: error.message });
  }
}

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }) : undefined,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000
    });
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes',
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }) : undefined,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Your account has been temporarily locked for security.',
      retryAfter: 900 // 15 minutes in seconds
    });
  }
});

// Payment endpoint rate limiter
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 payment attempts per minute
  message: 'Too many payment attempts, please try again later',
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:payment:'
  }) : undefined
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: 'Too many password reset requests, please try again later',
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:pwdreset:'
  }) : undefined
});

// Create booking rate limiter
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 bookings per minute
  message: 'Too many booking attempts, please slow down',
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:booking:'
  }) : undefined
});

module.exports = {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  passwordResetLimiter,
  bookingLimiter
};
