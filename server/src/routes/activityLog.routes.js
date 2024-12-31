const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLog.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, activityLogController.getActivityLogs);

module.exports = router; 