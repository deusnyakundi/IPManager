// server/src/routes/vlanblock.routes.js

const express = require('express');
const router = express.Router();
const vlanBlockController = require('../controllers/vlanblock.controller');

// Route to create a VLAN range
router.post('/vlan-ranges', vlanBlockController.createVLANRange);

// Route to get all VLAN ranges
router.get('/vlan-ranges', vlanBlockController.getVLANRanges);

// Route to delete a VLAN range
router.delete('/vlan-ranges:id', vlanBlockController.deleteVLANRange);

module.exports = router;