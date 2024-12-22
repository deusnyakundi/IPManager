const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const ipRoutes = require('./ip.routes');
const regionRoutes = require('./region.routes');
const siteRoutes = require('./site.routes');
const userRoutes = require('./user.routes');
const vlanBlockRoutes = require('./vlanblock.routes');

router.use('/auth', authRoutes);
router.use('/ip', ipRoutes);
router.use('/regions', regionRoutes);
router.use('/sites', siteRoutes);
router.use('/users', userRoutes);
router.use('/vlanblock', vlanBlockRoutes);

module.exports = router; 