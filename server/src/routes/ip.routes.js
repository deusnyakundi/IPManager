const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const ipController = require('../controllers/ip.controller');

// Protect all routes with authentication
router.use(authenticateToken);

// IP Blocks
router.get('/blocks', ipController.getIPBlocks);
router.post('/blocks', ipController.createIPBlock);
router.delete('/blocks/:id', ipController.deleteIPBlock);
router.get('/blocks/utilization', ipController.getIPBlockUtilization);

// IP Assignments
router.get('/assignments', ipController.getIPAssignments);
router.post('/assignments', ipController.createIPAssignment);
router.put('/assignments/:id', ipController.updateIPAssignment);
router.delete('/assignments/:id', ipController.deleteIPAssignment);

module.exports = router;