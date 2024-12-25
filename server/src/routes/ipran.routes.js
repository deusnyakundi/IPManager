const express = require ('express');

const router = express.Router();

const ipranController = require('../controllers/ipranCluster.controller');

router.get('/', ipranController.getAllClusters); 
router.post('/', ipranController.createCluster);
router.delete('/:id', ipranController.deleteCluster);
router.put('/:id', ipranController.updateCluster);

module.exports = router;
