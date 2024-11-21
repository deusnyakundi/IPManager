const express = require('express');
const router = express.Router();
const ipController = require('../controllers/ip.controller');

router.get('/blocks', ipController.getIPBlocks);
router.post('/blocks', ipController.createIPBlock);
router.delete('/blocks/:id', ipController.deleteIPBlock);

module.exports = router;