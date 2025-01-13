const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  uploadFile,
  getAnalyticsData,
  getUploadHistory,
  getFileStatus,
  generatePowerPoint,
  deleteUpload
} = require('../controllers/analytics.controller');

// Protect all routes with authentication
router.use(authenticateToken);

router.post('/upload', uploadFile);
router.get('/data', getAnalyticsData);
router.get('/uploads', getUploadHistory);
router.get('/upload/:id/status', getFileStatus);
router.get('/powerpoint', generatePowerPoint);
router.delete('/upload/:id', deleteUpload);

module.exports = router; 