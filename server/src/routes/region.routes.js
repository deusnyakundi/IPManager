const express = require('express');
const router = express.Router();
const regionController = require('../controllers/region.controller');

router.get('/', regionController.getRegions);
router.post('/', regionController.createRegion);
router.delete('/:id', regionController.deleteRegion);

module.exports = router;