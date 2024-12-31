const jwt = require('jsonwebtoken');

// Middleware to authenticate access token from Authorization header
exports.authenticateToken = (req, res, next) => {
  // Get the token from the Authorization header
  const accessToken = req.headers.authorization?.split(' ')[1]; // Extract token from 'Bearer <token>'

  if (!accessToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        shouldRefresh: true, // Flag to indicate the need to refresh the token
      });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to verify refresh token and issue a new access token
exports.refreshToken = (req, res) => {
  const refreshToken = req.headers.authorization?.split(' ')[1]; // Get refresh token from Authorization header

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    // Verify the refresh token (assuming refresh tokens have a longer expiry)
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const { userId } = decoded; // Extract user info or id from refresh token

    // Generate a new access token
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send the new access token back to the client
    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
};
