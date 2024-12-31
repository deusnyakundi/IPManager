const express = require('express');
const router = express.Router();
const ipController = require('../controllers/ip.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/blocks', authenticateToken,ipController.getIPBlocks);
router.post('/blocks', authenticateToken,ipController.createIPBlock);
router.delete('/blocks/:id', authenticateToken, ipController.deleteIPBlock);

module.exports = router;