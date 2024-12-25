const pool = require('../config/db');
const logger = require('../services/logger.service');

const ipranClusterController = {
  getAllClusters: async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ipran_clusters ORDER BY name`);
      res.json(result.rows);
    } catch (error) {
      logger.error('Error getting IPRAN clusters:', error);
      res.status(500).json({ message: 'Error getting IPRAN clusters' });
    }
  },

  createCluster: async (req, res) => {
    const { name, region_id } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO ipran_clusters (name) VALUES ($1) RETURNING *',
        [name, region_id]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      logger.error('Error creating IPRAN cluster:', error);
      if (error.constraint === 'ipran_clusters_name_key') {
        return res.status(400).json({ 
          message: 'IPRAN cluster with this name already exists' 
        });
      }
      res.status(500).json({ message: 'Error creating IPRAN cluster' });
    }
  },

  updateCluster: async (req, res) => {
    const { id } = req.params;
    const { name, region_id } = req.body;
    try {
      const result = await pool.query(
        'UPDATE ipran_clusters SET name = $1 WHERE id = $2 RETURNING *',
        [name, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'IPRAN cluster not found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Error updating IPRAN cluster:', error);
      if (error.constraint === 'ipran_clusters_name_key') {
        return res.status(400).json({ 
          message: 'IPRAN cluster with this name already exists' 
        });
      }
      res.status(500).json({ message: 'Error updating IPRAN cluster' });
    }
  },

  deleteCluster: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM ipran_clusters WHERE id = $1 RETURNING *',
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'IPRAN cluster not found' });
      }
      res.json({ message: 'IPRAN cluster deleted successfully' });
    } catch (error) {
      logger.error('Error deleting IPRAN cluster:', error);
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ 
          message: 'Cannot delete IPRAN cluster as it is being used by sites' 
        });
      }
      res.status(500).json({ message: 'Error deleting IPRAN cluster' });
    }
  }
};

module.exports = ipranClusterController; 