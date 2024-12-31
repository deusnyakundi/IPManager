const express = require('express');
const router = express.Router();
const vcidController = require('../controllers/vcid.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/ranges', authenticateToken,vcidController.getVCIDRanges);
router.post('/ranges', authenticateToken,vcidController.createVCIDRange);
router.delete('/ranges/:id', authenticateToken, vcidController.deleteVCIDRange);

module.exports = router; 