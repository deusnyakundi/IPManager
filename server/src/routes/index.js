const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const ipRoutes = require('./ip.routes');
const regionRoutes = require('./region.routes');
const mspsRoutes = require('./msp.routes');
const siteRoutes = require('./site.routes');
const userRoutes = require('./user.routes');
const vlanBlockRoutes = require('./vlanblock.routes');
const ipranRoutes = require('./ipran.routes')

router.use('/auth', authRoutes);
router.use('/ip', ipRoutes);
router.use('/regions', regionRoutes);
router.use('/msps', mspsRoutes);
router.use('/ipran-clusters', ipranRoutes);
router.use('/sites', siteRoutes);
router.use('/users', userRoutes);
router.use('/vlanblock', vlanBlockRoutes);


module.exports = router; 