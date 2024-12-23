const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const loginLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX,
  message: {
    error: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = loginLimiter; 