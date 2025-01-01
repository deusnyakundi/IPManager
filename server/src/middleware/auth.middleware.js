const jwt = require('jsonwebtoken');

// Middleware to authenticate access tokens
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from the header

  try {
    // Verify the access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user information to the request object
    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // If token is expired, inform the client to refresh the token
      return res.status(401).json({ error: 'Access token expired. Please refresh your token.' });
    }

    return res.status(403).json({ error: 'Invalid access token' });
  }
};

module.exports = authMiddleware;
