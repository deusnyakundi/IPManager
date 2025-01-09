const express = require('express');
const router = express.Router();
const { generateToken } = require('../middleware/csrf.middleware');

// Get CSRF token
router.get('/csrf-token', (req, res) => {
  const token = generateToken();
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ csrfToken: token });
});

module.exports = router; 