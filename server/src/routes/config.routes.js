const express = require('express');
const router = express.Router();
const configController = require('../controllers/config.controller');

router.get('/assignments', configController.getAssignments);
router.post('/generate', configController.generateConfig);

module.exports = router; 