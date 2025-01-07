const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, phone, role, two_factor_enabled FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createUser = async (req, res) => {
  const { username, password, email, phone, role, forcePasswordChange = true } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (
        username, 
        password, 
        email, 
        phone, 
        role, 
        force_password_change
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, username, email, phone, role`,
      [username, hashedPassword, email, phone, role, forcePasswordChange]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, phone, role } = req.body;

  try {
    // First check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username is being changed and if it's already taken
    if (username !== userCheck.rows[0].username) {
      const usernameCheck = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Check if email is being changed and if it's already taken
    if (email !== userCheck.rows[0].email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update user details
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, 
           email = $2, 
           phone = $3, 
           role = $4
       WHERE id = $5 
       RETURNING id, username, email, phone, role, two_factor_enabled`,
      [username, email, phone, role, id]
    );

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggle2FA = async (req, res) => {
  const { id } = req.params;
  const { enabled, email } = req.body;

  try {
    // First check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userCheck.rows[0];

    // Validate email if 2FA is being enabled
    if (enabled && !email && !user.email) {
      return res.status(400).json({ error: 'Email is required for enabling 2FA' });
    }

    // Use provided email or fallback to user's existing email
    const emailToUse = email || user.email;

    // Update user's 2FA settings
    const result = await pool.query(
      'UPDATE users SET two_factor_enabled = $1, email = $2 WHERE id = $3 RETURNING id, username, email, two_factor_enabled',
      [enabled, emailToUse, id]
    );

    res.json({
      message: enabled ? '2FA enabled successfully' : '2FA disabled successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error toggling 2FA:', error);
    res.status(500).json({ error: 'Failed to update 2FA settings' });
  }
};