const express = require('express');
const router = express.Router();
const { uploadFile, getAnalyticsData } = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Protected routes
router.use(authenticateToken);

// File upload route
router.post('/upload', uploadFile);

// Get analytics data
router.get('/data', getAnalyticsData);

module.exports = router; 