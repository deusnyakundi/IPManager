// server/src/routes/vlanblock.routes.js

const express = require('express');
const router = express.Router();
const vlanBlockController = require('../controllers/vlanblock.controller');

// VLAN range routes
router.get('/ranges', vlanBlockController.getVLANRanges);
router.post('/ranges', vlanBlockController.createVLANRange);
router.delete('/ranges/:id', vlanBlockController.deleteVLANRange);

module.exports = router;