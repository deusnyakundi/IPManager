const { generateToken } = require('../middleware/csrf.middleware');

const getCSRFToken = (req, res) => {
  // Generate a new token
  const token = generateToken();
  
  // Store it in the session
  req.session.csrfToken = token;
  
  // Set it in a cookie as well (as a backup)
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Needs to be accessible by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  // Send it in the response
  res.json({ csrfToken: token });
};

module.exports = {
  getCSRFToken,
}; 