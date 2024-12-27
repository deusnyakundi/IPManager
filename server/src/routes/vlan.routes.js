const express = require('express');
const router = express.Router();
const vlanController = require('../controllers/vlan.controller');

// VLAN Range routes
router.get('/ranges', vlanController.getVLANRanges);
router.post('/ranges', vlanController.createVLANRange);
router.delete('/ranges/:id', vlanController.deleteVLANRange);

// Assigned VLAN routes
router.get('/assigned', vlanController.getAssignedVLANs);
router.post('/assign', vlanController.assignVLAN);
router.delete('/assigned/:id', vlanController.unassignVLAN);

module.exports = router; 