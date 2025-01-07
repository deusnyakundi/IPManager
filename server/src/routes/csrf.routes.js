const express = require('express');
const router = express.Router();
const { getCSRFToken } = require('../controllers/csrf.controller');

router.get('/csrf-token', getCSRFToken);

module.exports = router; 