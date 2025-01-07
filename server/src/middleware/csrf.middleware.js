const crypto = require('crypto');

// Generate a CSRF token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate token
const validateToken = (token) => {
  return token && typeof token === 'string' && token.length === 64;
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  const storedToken = req.session.csrfToken;

  if (!validateToken(token) || token !== storedToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

// Middleware to set CSRF token
const setCsrfToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }
  next();
};

module.exports = {
  csrfProtection,
  setCsrfToken,
  generateToken,
}; 