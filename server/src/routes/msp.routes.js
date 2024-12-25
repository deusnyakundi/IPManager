const express = require('express');
const router = express.Router();
const mspsController = require('../controllers/msp.controller');

router.get('/', mspsController.getAllMSPs); 
router.post('/', mspsController.createMSP);
router.delete('/:id', mspsController.deleteMSP);
router.put('/:id', mspsController.updateMSP);
    
module.exports = router;
module.exports = router;