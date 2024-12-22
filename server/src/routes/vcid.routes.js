const express = require('express');
const router = express.Router();
const vcidController = require('../controllers/vcid.controller');

router.get('/ranges', vcidController.getVCIDRanges);
router.post('/ranges', vcidController.createVCIDRange);
router.delete('/ranges/:id', vcidController.deleteVCIDRange);

module.exports = router; 