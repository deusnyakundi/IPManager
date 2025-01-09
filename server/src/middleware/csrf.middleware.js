const crypto = require('crypto');

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const validateToken = (req, res, next) => {
  const token = req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'];

  if (!token || !headerToken || token !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

module.exports = {
  generateToken,
  validateToken
}; 