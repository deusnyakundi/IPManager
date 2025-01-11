const express = require('express');
const router = express.Router();
const ipController = require('../controllers/ip.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/blocks', authenticateToken,ipController.getIPBlocks);
router.post('/blocks', authenticateToken,ipController.createIPBlock);
router.delete('/blocks/:id', authenticateToken, ipController.deleteIPBlock);

// New routes for IP assignments
router.get('/assignments', authenticateToken, ipController.getIPAssignments);
router.patch('/assignments/:id', authenticateToken, ipController.updateIPAssignment);

module.exports = router;