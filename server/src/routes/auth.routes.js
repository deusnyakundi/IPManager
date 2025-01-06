const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Rate limiting for OTP endpoints
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
});

// Auth routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.me);

// Password change routes
router.post('/change-password', authenticateToken, authController.changePassword);
router.post('/first-time-password', authController.firstTimePasswordChange); // No auth required

// 2FA routes
router.post('/verify-otp', otpLimiter, authController.verifyOTP);
router.post('/resend-otp', otpLimiter, authController.resendOTP);
router.post('/configure-2fa', authenticateToken, isAdmin, authController.configure2FA);
router.post('/update-2fa-email', authenticateToken, authController.update2FAEmail);

module.exports = router;
