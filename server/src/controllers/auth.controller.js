const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error.message);
    throw new Error('Token generation failed');
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    console.log('Tokens generated successfully'); // Debug
    console.log('AccessToken:', accessToken);
    console.log('RefreshToken:', refreshToken);
 
    res.json({ message: 'Login successful', accessToken, user: { id: user.id, username: user.username, role:user.role} });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.refresh = async (req, res) => {
  const refreshToken = req.body.refreshToken; // Expect refreshToken in the request body

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token not found' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if refresh token exists in database
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND refresh_token = $2',
      [decoded.userId, refreshToken]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in database
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [newRefreshToken, user.id]
    );

    console.log('Refresh Token generated and issued successfully'); // Debug
    console.log('AccessToken:', accessToken);
    res.json({ message: 'Token refreshed successfully', accessToken });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // Clear refresh token in database
    if (req.user) {
      await pool.query(
        'UPDATE users SET refresh_token = NULL WHERE id = $1',
        [req.user.userId]
      );
    }

    // Clear cookies
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0)
    });

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0)
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.register = async (req, res) => {
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

const isValidPassword = (password) => {
  // Implement your password complexity logic here
  return password.length >= 8; // Example: minimum length of 8 characters
};
