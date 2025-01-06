const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  // First try to get token from cookie
  const tokenFromCookie = req.cookies.accessToken;
  
  // If no cookie, try Authorization header
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  // Use cookie token if available, otherwise use header token
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or invalid' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Access token expired' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
