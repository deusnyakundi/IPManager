// server/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

exports.authenticateToken = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Token has expired, try to refresh
      return res.status(401).json({ 
        error: 'Token expired',
        shouldRefresh: true
      });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};