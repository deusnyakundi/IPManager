const express = require('express');
const router = express.Router();
const siteController = require('../controllers/site.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken); // Protect all routes in this router

// Site Management Routes
router.get('/', siteController.getAllSites);
router.post('/', siteController.createSite);

// Export/Import routes
router.get('/export/sites', siteController.exportSites);
router.post('/import', siteController.importSites);

// These routes should come after the specific routes
router.get('/:id', siteController.getSiteById);
router.put('/:id', siteController.updateSite);
router.delete('/:id', siteController.deleteSite);

// IP Generation Route
router.post('/generate-ip', siteController.generateIPForSite);

module.exports = router;