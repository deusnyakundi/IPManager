const express = require('express');
const router = express.Router();
const multer = require('multer');
const siteController = require('../controllers/site.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken); // Protect all routes in this router

// Site Management Routes
router.get('/', siteController.getAllSites);
router.post('/', siteController.createSite);

// Export/Import routes
router.get('/export', siteController.exportSites);
router.post('/import', upload.single('file'), siteController.importSites);

// These routes should come after the specific routes
router.get('/:id', siteController.getSiteById);
router.put('/:id', siteController.updateSite);
router.delete('/:id', siteController.deleteSite);

// IP Generation Route
router.post('/generate-ip', siteController.generateIPForSite);

module.exports = router;