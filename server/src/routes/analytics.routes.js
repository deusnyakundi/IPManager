const express = require('express');
const router = express.Router();
const { uploadFile, getAnalyticsData, getUploadHistory, getFileStatus, analyzeData, generatePowerPoint } = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validateToken } = require('../middleware/csrf.middleware');

// Protected routes
router.use(authenticateToken);

// Routes that need CSRF validation
router.post('/upload', validateToken, uploadFile);

// Routes that don't need CSRF validation (GET requests)
router.get('/data', getAnalyticsData);
router.get('/uploads', getUploadHistory);
router.get('/upload/:id/status', getFileStatus);
router.get('/analyze', analyzeData);
router.get('/powerpoint', generatePowerPoint);

module.exports = router; 