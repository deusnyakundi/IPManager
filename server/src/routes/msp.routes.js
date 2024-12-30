const express = require('express');
const router = express.Router();
const mspsController = require('../controllers/msp.controller');
//const { authenticateToken } = require('../middleware/auth.middleware');

//router.use(authenticateToken); // Protect all routes in this router

router.get('/', mspsController.getAllMSPs); 
router.post('/', mspsController.createMSP);
router.delete('/:id', mspsController.deleteMSP);
router.put('/:id', mspsController.updateMSP);
    
module.exports = router;