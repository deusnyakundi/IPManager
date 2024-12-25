const pool = require('../config/db');
const logger = require('../services/logger.service');

const mspController = {
  getAllMSPs: async (req, res) => {
    try {
      console.log('Received GET request for /api/msps');
      const result = await pool.query('SELECT * FROM msps ORDER BY name');
      res.json(result.rows);
    } catch (error) {
      logger.error('Error getting MSPs:', error);
      res.status(500).json({ message: 'Error getting MSPs' });
    }
  },

  createMSP: async (req, res) => {
    const { name } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO msps (name) VALUES ($1) RETURNING *',
        [name]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      logger.error('Error creating MSP:', error);
      if (error.constraint === 'msps_name_key') {
        return res.status(400).json({ message: 'MSP name already exists' });
      }
      res.status(500).json({ message: 'Error creating MSP' });
    }
  },

  updateMSP: async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
      const result = await pool.query(
        'UPDATE msps SET name = $1 WHERE id = $2 RETURNING *',
        [name, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'MSP not found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Error updating MSP:', error);
      if (error.constraint === 'msps_name_key') {
        return res.status(400).json({ message: 'MSP name already exists' });
      }
      res.status(500).json({ message: 'Error updating MSP' });
    }
  },

  deleteMSP: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM msps WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'MSP not found' });
      }
      res.json({ message: 'MSP deleted successfully' });
    } catch (error) {
      logger.error('Error deleting MSP:', error);
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ message: 'Cannot delete MSP as it is being used by sites' });
      }
      res.status(500).json({ message: 'Error deleting MSP' });
    }
  }
};

module.exports = mspController; 
