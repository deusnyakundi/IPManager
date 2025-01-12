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

exports.getIPAssignments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ip_assignments.*,
        ic.name AS cluster_name,
        u.username AS assigned_by_user,
        COUNT(*) FILTER (WHERE vendor = 'Huawei') OVER () as huawei_count,
        COUNT(*) FILTER (WHERE vendor = 'Nokia') OVER () as nokia_count
      FROM ip_assignments
      LEFT JOIN ipran_clusters ic ON ip_assignments.ipran_cluster_id = ic.id
      LEFT JOIN users u ON ip_assignments.assigned_by = u.id
      ORDER BY ip_assignments.created_at DESC
    `);

    // Transform the result to include vendor counts
    const assignments = result.rows.map(row => {
      const { huawei_count, nokia_count, ...assignment } = row;
      return assignment;
    });

    // Add vendor counts to the response
    const response = {
      assignments,
      stats: {
        huawei: result.rows[0]?.huawei_count || 0,
        nokia: result.rows[0]?.nokia_count || 0
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching IP assignments:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateIPAssignment = async (req, res) => {
  const { id } = req.params;
  const { vendor } = req.body;
  const userId = req.user.userId;

  try {
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update the IP assignment
      const updateResult = await client.query(
        `UPDATE ip_assignments 
         SET vendor = $1, 
             modified_by = $2,
             modified_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [vendor, userId, id]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'IP assignment not found' });
      }

      // Get the updated record with related information
      const result = await client.query(`
        SELECT 
          ip_assignments.*,
          ic.name AS cluster_name,
          u.username AS assigned_by_user
        FROM ip_assignments
        LEFT JOIN ipran_clusters ic ON ip_assignments.ipran_cluster_id = ic.id
        LEFT JOIN users u ON ip_assignments.assigned_by = u.id
        WHERE ip_assignments.id = $1
      `, [id]);

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating IP assignment:', error);
    res.status(500).json({ error: error.message });
  }
};