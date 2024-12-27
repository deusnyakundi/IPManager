const pool = require('../config/db');

exports.getIPBlocks = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          ip_blocks.id, 
          ip_blocks.block, 
          ip_blocks.ipran_cluster_id,
          ic.name AS cluster_name
        FROM ip_blocks
        LEFT JOIN ipran_clusters ic ON ip_blocks.ipran_cluster_id = ic.id
        ORDER BY ip_blocks.id
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching IP blocks:', error);
      res.status(500).json({ error: error.message });
    }
  };
  exports.createIPBlock = async (req, res) => {
    const { block, ipranClusterId } = req.body;
    try {
      // Check if cluster exists
      const clusterCheck = await pool.query(
        'SELECT id FROM ipran_clusters WHERE id = $1',
        [ipranClusterId]
      );

      if (clusterCheck.rows.length === 0) {
        return res.status(400).json({ 
          message: 'Invalid IPRAN cluster ID' 
        });
      }

      // Check for duplicate block in the same cluster
      const duplicate = await pool.query(
        'SELECT id FROM ip_blocks WHERE block = $1 AND ipran_cluster_id = $2',
        [block, ipranClusterId]
      );

      if (duplicate.rows.length > 0) {
        return res.status(400).json({ 
          message: 'IP block already exists in this cluster' 
        });
      }

      const result = await pool.query(
        'INSERT INTO ip_blocks (block, ipran_cluster_id) VALUES ($1, $2) RETURNING *',
        [block, ipranClusterId]
      );
      
      // Fetch the newly created block with cluster information
      const newBlock = await pool.query(`
        SELECT 
          ip_blocks.id, 
          ip_blocks.block, 
          ip_blocks.ipran_cluster_id,
          ic.name AS cluster_name
        FROM ip_blocks
        LEFT JOIN ipran_clusters ic ON ip_blocks.ipran_cluster_id = ic.id
        WHERE ip_blocks.id = $1
      `, [result.rows[0].id]);
      
      res.status(201).json(newBlock.rows[0]);
    } catch (error) {
      console.error('Error creating IP block:', error);
      res.status(500).json({ error: error.message });
    }
  };


exports.deleteIPBlock = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM ip_blocks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'IP block not found' 
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting IP block:', error);
    res.status(500).json({ error: error.message });
  }
};