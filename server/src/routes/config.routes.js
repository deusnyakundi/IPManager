const express = require('express');
const router = express.Router();
const configController = require('../controllers/config.controller');

router.get('/assignments', configController.getAssignments);
router.get('/all-assignments', configController.getAllAssignments);
router.post('/generate', configController.generateConfig);

module.exports = router; 