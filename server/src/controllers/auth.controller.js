const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Import crypto for hashing
// server/src/controllers/auth.controller.js


const generateTokens = (user) => {
 console.log('Generating tokens for user:', user); // Debug
  try {
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
   console.log('Access Token', accessToken)
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error.message);
    throw new Error('Token generation failed');
  }
};



exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    // Validate credentials
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Hash the refresh token before saving it in the database
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Update the refresh token hash in the database
    await pool.query(
      'UPDATE users SET refresh_token_hash = $1 WHERE id = $2',
      [refreshTokenHash, user.id]
    );

    // Send the refresh token as an HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Prevent access by JavaScript
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      sameSite: 'strict', // Protect against CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Send the access token in the response
    res.json({
      message: 'Login successful',
      accessToken,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Get refresh token from HttpOnly cookie
  console.log('Cookies:', req.cookies);

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Hash the received refresh token before querying the database
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Check if the hashed refresh token exists in the database
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND refresh_token_hash = $2',
      [decoded.userId, refreshTokenHash]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Hash the new refresh token before storing it in the database
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    // Update the refresh token hash in the database
    await pool.query(
      'UPDATE users SET refresh_token_hash = $1 WHERE id = $2',
      [newRefreshTokenHash, user.id]
    );

    // Send the new refresh token as an HttpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send the new access token in the response
    res.json({ message: 'Token refreshed successfully', accessToken });
  } catch (error) {
    console.error("Refresh Error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.logout = async (req, res) => {
  try {
    // Clear refresh token hash in database if a user is authenticated
    if (req.user) {
      await pool.query('UPDATE users SET refresh_token_hash = NULL WHERE id = $1', [req.user.userId]);
    }

    // Clear both access and refresh tokens from HttpOnly cookies on the client-side
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.register = async (req, res) => {

  // Function to validate password complexity
  const isValidPassword = (password) => {
    // Regex for password complexity:
    // - At least 8 characters
    // - At least one lowercase letter
    // - At least one uppercase letter
    // - At least one digit
    // - At least one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return passwordRegex.test(password);
  };


  const { username, password, role } = req.body;

  // Check password complexity
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password does not meet complexity requirements.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *', [username, hashedPassword, role]);
    const user = result.rows[0];

    res.status(201).json({ user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

