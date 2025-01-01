import jwt from 'jsonwebtoken';
import axios from 'axios'; // Import axios to make requests to the refresh endpoint

// Middleware to authenticate access tokens
export const authenticateToken = async (req, res, next) => {
  console.log('Incoming Cookies:', req.cookies); 
  console.log('Incoming headers:', req.headers.authorization);

  const authHeader = req.headers.authorization;

  // Check if the access token is present
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
    // Handle expired token
    if (error.name === 'TokenExpiredError') {
      console.log('Access token expired, attempting refresh...');

      // Check if there is a refresh token
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token missing. Please log in again.' });
      }

      try {
        // Call the refresh token API
            // Call the refresh token API and include the refresh token as a cookie
            const response = await axios.post(
              'http://localhost:9000/api/auth/refresh',
              {},
              {
                headers: {
                  Cookie: `refreshToken=${refreshToken}`, // Explicitly set the cookie header
                },
              }
            );

        // If refresh is successful, generate a new access token and refresh token
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Attach the new access token to the response headers
        res.setHeader('Authorization', `Bearer ${accessToken}`);

        // Set both the new access token and new refresh token in cookies
        //res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
       // res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
            // Send the new refresh token as an HttpOnly cookie
          res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

        // Proceed with the next middleware or route handler
        return next();
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        return res.status(401).json({ error: 'Unable to refresh access token. Please log in again.' });
      }
    }

    // Handle invalid token or other errors
    return res.status(403).json({ error: 'Invalid access token' });
  }
};
