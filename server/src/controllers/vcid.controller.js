const pool = require('../config/db');

exports.getVCIDRanges = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        vr.*,
        ic.name as cluster_name
      FROM vcid_ranges vr
      LEFT JOIN ipran_clusters ic ON vr.ipran_cluster_id = ic.id
      ORDER BY vr.start_primary_vcid
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting VCID ranges:', error);
    res.status(500).json({ message: 'Error getting VCID ranges' });
  }
};

exports.createVCIDRange = async (req, res) => {
  const { 
    ipran_cluster_id,
    start_primary_vcid, 
    end_primary_vcid,
    start_secondary_vcid,
    end_secondary_vcid,
    start_vsi_id,
    end_vsi_id
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate IPRAN cluster exists
    const clusterCheck = await client.query(
      'SELECT id FROM ipran_clusters WHERE id = $1',
      [ipran_cluster_id]
    );

    if (clusterCheck.rows.length === 0) {
      throw new Error('Invalid IPRAN cluster');
    }

    // Check for overlapping ranges in the same cluster
    const overlap = await client.query(`
      SELECT id FROM vcid_ranges 
      WHERE ipran_cluster_id = $1 
      AND (
        (start_primary_vcid <= $2 AND end_primary_vcid >= $2) OR
        (start_primary_vcid <= $3 AND end_primary_vcid >= $3) OR
        (start_secondary_vcid <= $4 AND end_secondary_vcid >= $4) OR
        (start_secondary_vcid <= $5 AND end_secondary_vcid >= $5) OR
        (start_vsi_id <= $6 AND end_vsi_id >= $6) OR
        (start_vsi_id <= $7 AND end_vsi_id >= $7)
      )`,
      [
        ipran_cluster_id,
        start_primary_vcid,
        end_primary_vcid,
        start_secondary_vcid,
        end_secondary_vcid,
        start_vsi_id,
        end_vsi_id
      ]
    );

    if (overlap.rows.length > 0) {
      throw new Error('VCID range overlaps with existing range');
    }

    const result = await client.query(
      `INSERT INTO vcid_ranges (
        ipran_cluster_id, 
        start_primary_vcid, 
        end_primary_vcid,
        start_secondary_vcid,
        end_secondary_vcid,
        start_vsi_id,
        end_vsi_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        ipran_cluster_id,
        start_primary_vcid, 
        end_primary_vcid,
        start_secondary_vcid,
        end_secondary_vcid,
        start_vsi_id,
        end_vsi_id
      ]
    );

    // Fetch complete range info with cluster name
    const newRange = await client.query(`
      SELECT 
        vr.*,
        ic.name as cluster_name
      FROM vcid_ranges vr
      LEFT JOIN ipran_clusters ic ON vr.ipran_cluster_id = ic.id
      WHERE vr.id = $1
    `, [result.rows[0].id]);

    await client.query('COMMIT');
    res.status(201).json(newRange.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating VCID range:', error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};

exports.deleteVCIDRange = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM vcid_ranges WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'VCID range not found' });
    }
    res.json({ message: 'VCID range deleted successfully' });
  } catch (error) {
    console.error('Error deleting VCID range:', error);
    res.status(500).json({ message: 'Error deleting VCID range' });
  }
}; 