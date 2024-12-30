const express = require('express');
const router = express.Router();
const regionController = require('../controllers/region.controller');
//const { authenticateToken } = require('../middleware/auth.middleware');

//router.use(authenticateToken); // Protect all routes in this router

router.get('/', regionController.getAllRegions); 
router.post('/', regionController.createRegion);
router.delete('/:id', regionController.deleteRegion);

module.exports = router;