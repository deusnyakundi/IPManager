const express = require('express');
const router = express.Router();
const siteController = require('../controllers/site.controller');

// Site Management Routes
router.get('/', siteController.getAllSites);
router.post('/', siteController.createSite);
router.put('/:id', siteController.updateSite);
router.delete('/:id', siteController.deleteSite);

// IP Generation Route
router.post('/generate-ip', siteController.generateIPForSite);

// Get Site Details Route
router.get('/:id', siteController.getSiteById);

module.exports = router;