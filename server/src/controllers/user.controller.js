const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, phone,role FROM users');
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

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};