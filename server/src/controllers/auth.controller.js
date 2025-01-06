const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateOTP, hashOTP, isOTPExpired } = require('../utils/otp.utils');
const { sendOTP } = require('../services/notification.service');

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
    console.log('New Access Token', accessToken)
    console.log('New RefreshToken', refreshToken)
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

    // Check if password change is required
    if (user.force_password_change) {
      return res.status(403).json({ 
        error: 'Password change required',
        requirePasswordChange: true,
        userId: user.id
      });
    }

    // Check if 2FA is enabled for the user
    if (user.two_factor_enabled) {
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in database
      await pool.query(
        'INSERT INTO user_otps (user_id, otp_hash, expires_at, delivery_method) VALUES ($1, $2, $3, $4)',
        [user.id, otpHash, expiresAt, 'email']
      );

      // Send OTP via email
      await sendOTP(user, otp);

      return res.json({
        message: 'OTP sent to your email',
        requiresOTP: true,
        userId: user.id,
        method: 'email'
      });
    }

    // If 2FA is not enabled, proceed with normal login
    const { accessToken, refreshToken } = generateTokens(user);

    // Hash the refresh token before saving it in the database
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Update the refresh token hash in the database
    await pool.query(
      'UPDATE users SET refresh_token_hash = $1 WHERE id = $2',
      [refreshTokenHash, user.id]
    );

    // Send the access token as an HttpOnly cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    // Send the refresh token as an HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    // Get the latest unused OTP for the user
    const result = await pool.query(
      'SELECT * FROM user_otps WHERE user_id = $1 AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    const otpRecord = result.rows[0];
    if (!otpRecord) {
      return res.status(400).json({ error: 'No valid OTP found' });
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark OTP as used
    await pool.query(
      'UPDATE user_otps SET is_used = TRUE WHERE id = $1',
      [otpRecord.id]
    );

    // Get user details
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Generate tokens and complete login
    const { accessToken, refreshToken } = generateTokens(user);

    // Hash the refresh token
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Update the refresh token hash in the database
    await pool.query(
      'UPDATE users SET refresh_token_hash = $1 WHERE id = $2',
      [refreshTokenHash, user.id]
    );

    // Set cookies
        res.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Authentication successful',
      accessToken,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.resendOTP = async (req, res) => {
  const { userId } = req.body;

  try {
    // Get user details
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store new OTP
    await pool.query(
      'INSERT INTO user_otps (user_id, otp_hash, expires_at, delivery_method) VALUES ($1, $2, $3, $4)',
      [userId, otpHash, expiresAt, 'email']
    );

    // Send new OTP via email
    await sendOTP(user, otp);

    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};

exports.configure2FA = async (req, res) => {
  const { userId, enabled, email } = req.body;

  try {
    // Only admins can enable/disable 2FA
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can manage 2FA settings' });
    }

    // Validate email if 2FA is being enabled
    if (enabled && !email) {
      return res.status(400).json({ error: 'Email is required for 2FA' });
    }

    await pool.query(
      'UPDATE users SET two_factor_enabled = $1, email = $2 WHERE id = $3',
      [enabled, email, userId]
    );

    // Log the 2FA configuration change
    await pool.query(
      'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, old_values, new_values, additional_details) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        req.user.id,
        '2FA_CONFIG_CHANGE',
        'USER',
        userId,
        JSON.stringify({ two_factor_enabled: !enabled }),
        JSON.stringify({ two_factor_enabled: enabled }),
        JSON.stringify({
          target_user_id: userId,
          action: enabled ? 'enabled' : 'disabled',
          timestamp: new Date()
        })
      ]
    );

    res.json({
      message: enabled ? '2FA enabled successfully' : '2FA disabled successfully',
      method: 'email'
    });
  } catch (error) {
    console.error('2FA Configuration Error:', error);
    res.status(500).json({ error: 'Failed to update 2FA settings' });
  }
};

// New endpoint for users to update their 2FA email only
exports.update2FAEmail = async (req, res) => {
  const { userId, email } = req.body;

  try {
    // Users can only update their own email
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only update your own 2FA email' });
    }

    // Check if 2FA is enabled for the user
    const userResult = await pool.query(
      'SELECT two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows[0]?.two_factor_enabled) {
      return res.status(400).json({ error: '2FA is not enabled for this user' });
    }

    // Update email
    await pool.query(
      'UPDATE users SET email = $1 WHERE id = $2',
      [email, userId]
    );

    res.json({ message: '2FA email updated successfully' });
  } catch (error) {
    console.error('2FA Email Update Error:', error);
    res.status(500).json({ error: 'Failed to update 2FA email' });
  }
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.cookies;

  console.log('Refresh Token Received:', refreshToken);

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    // Verify the refresh token using the secret
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Hash the received refresh token for database comparison
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Query the database to validate the hashed refresh token
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND refresh_token_hash = $2',
      [decoded.userId, refreshTokenHash]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate a new access token
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log('New Access Token Generated:', accessToken);

    // Send the new access token as an HttpOnly cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error("Refresh Error:", error);
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Refresh token expired. Please log in again.' });
    }
    return res.status(500).json({ error: 'Internal server error' });
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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return passwordRegex.test(password);
  };

  const { username, password, email, phone, role, forcePasswordChange = true } = req.body;

  // Check password complexity
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password does not meet complexity requirements.' });
  }

  try {
    // Check if username or email already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: existingUser.rows[0].username === username ? 
          'Username already exists' : 
          'Email already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user with all fields
    const result = await pool.query(
      `INSERT INTO users (
        username, 
        password, 
        email, 
        phone, 
        role, 
        force_password_change,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING *`,
      [username, hashedPassword, email, phone, role, forcePasswordChange]
    );

    const user = result.rows[0];

    // Log user creation in activity log
    await pool.query(
      'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, new_values, additional_details) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        req.user?.id || null,
        'USER_CREATED',
        'USER',
        user.id,
        JSON.stringify({
          username: user.username,
          role: user.role,
          email: user.email
        }),
        JSON.stringify({
          created_user_id: user.id,
          timestamp: new Date()
        })
      ]
    );

    res.status(201).json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        email: user.email,
        phone: user.phone
      } 
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

exports.me = async (req, res) => {
    try {
        // Get user details from database using the ID from the authenticated request
        const result = await pool.query(
            'SELECT id, username, role, email, two_factor_enabled FROM users WHERE id = $1',
            [req.user.userId]
        );

        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user data (excluding sensitive information)
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email,
            two_factor_enabled: user.two_factor_enabled
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.changePassword = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  // Function to validate password complexity
  const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return passwordRegex.test(password);
  };

  try {
    // Get user details
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidCurrentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: 'New password does not meet complexity requirements' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and force_password_change flag
    await pool.query(
      'UPDATE users SET password = $1, force_password_change = false WHERE id = $2',
      [hashedPassword, userId]
    );

    // Log password change
    await pool.query(
      'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, additional_details) VALUES ($1, $2, $3, $4, $5)',
      [
        userId,
        'PASSWORD_CHANGED',
        'USER',
        userId,
        JSON.stringify({
          user_id: userId,
          timestamp: new Date(),
          reason: 'first_login'
        })
      ]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password Change Error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

exports.firstTimePasswordChange = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  // Function to validate password complexity
  const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return passwordRegex.test(password);
  };

  try {
    // Get user details
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND force_password_change = true',
      [userId]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found or password change not required' });
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidCurrentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: 'New password does not meet complexity requirements' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and force_password_change flag
    await pool.query(
      'UPDATE users SET password = $1, force_password_change = false WHERE id = $2',
      [hashedPassword, userId]
    );

    // Log password change
    await pool.query(
      'INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, additional_details) VALUES ($1, $2, $3, $4, $5)',
      [
        userId,
        'PASSWORD_CHANGED',
        'USER',
        userId,
        JSON.stringify({
          user_id: userId,
          timestamp: new Date(),
          reason: 'first_login'
        })
      ]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('First Time Password Change Error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

