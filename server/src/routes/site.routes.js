const express = require('express');
const router = express.Router();
const siteController = require('../controllers/site.controller');

// Route to generate an IP for a site
router.post('/generate-ip', siteController.generateIPForSite);

// Route to get all sites (if needed)
router.get('/', siteController.getAllSites);

// Route to delete a site (if needed)
router.delete('/:id', siteController.deleteSite);

module.exports = router;