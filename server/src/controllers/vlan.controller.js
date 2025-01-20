const pool = require('../config/db');

exports.getVLANRanges = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        vr.id,
        vr.start_vlan,
        vr.end_vlan,
        vr.ipran_cluster_id,
        ic.name as cluster_name
      FROM vlan_ranges vr
      LEFT JOIN ipran_clusters ic ON vr.ipran_cluster_id = ic.id
      ORDER BY vr.start_vlan
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting VLAN ranges:', error);
    res.status(500).json({ message: 'Error getting VLAN ranges' });
  }
};

exports.createVLANRange = async (req, res) => {
  const { start_vlan, end_vlan, ipranClusterId } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check for overlapping ranges in the same cluster
    const overlap = await client.query(`
      SELECT id FROM vlan_ranges 
      WHERE ipran_cluster_id = $1 
      AND (
        (start_vlan <= $2 AND end_vlan >= $2) OR
        (start_vlan <= $3 AND end_vlan >= $3) OR
        (start_vlan >= $2 AND end_vlan <= $3)
      )`,
      [ipranClusterId, start_vlan, end_vlan]
    );

    if (overlap.rows.length > 0) {
      throw new Error('VLAN range overlaps with existing range');
    }

    const result = await client.query(
      'INSERT INTO vlan_ranges (start_vlan, end_vlan, ipran_cluster_id) VALUES ($1, $2, $3) RETURNING *',
      [start_vlan, end_vlan, ipranClusterId]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating VLAN range:', error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};

exports.deleteVLANRange = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if the VLAN range exists
    const rangeCheck = await client.query(`
      SELECT vr.* 
      FROM vlan_ranges vr
      WHERE vr.id = $1`,
      [id]
    );

    if (rangeCheck.rows.length === 0) {
      throw new Error('VLAN range not found');
    }

    // Delete the range
    await client.query('DELETE FROM vlan_ranges WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting VLAN range:', error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};

exports.getAssignedVLANs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id,
        v.vlan,
        v.is_assigned,
        v.ipran_cluster_id,
        ic.name as cluster_name
      FROM vlans v
      LEFT JOIN ipran_clusters ic ON v.ipran_cluster_id = ic.id
      ORDER BY v.vlan
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting assigned VLANs:', error);
    res.status(500).json({ message: 'Error getting assigned VLANs' });
  }
};

exports.assignVLAN = async (req, res) => {
  const { vlan, ipranClusterId } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if VLAN is within any defined range for this cluster
    const rangeCheck = await client.query(`
      SELECT id FROM vlan_ranges 
      WHERE ipran_cluster_id = $1 
      AND $2 BETWEEN start_vlan AND end_vlan`,
      [ipranClusterId, vlan]
    );

    if (rangeCheck.rows.length === 0) {
      throw new Error('VLAN is not within any defined range for this cluster');
    }

    // Check if VLAN is already assigned
    const duplicateCheck = await client.query(
      'SELECT id FROM vlans WHERE vlan = $1 AND ipran_cluster_id = $2',
      [vlan, ipranClusterId]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new Error('VLAN is already assigned in this cluster');
    }

    // Assign the VLAN
    const result = await client.query(
      'INSERT INTO vlans (vlan, ipran_cluster_id, is_assigned) VALUES ($1, $2, true) RETURNING *',
      [vlan, ipranClusterId]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error assigning VLAN:', error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};

exports.unassignVLAN = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      'DELETE FROM vlans WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('VLAN not found');
    }

    await client.query('COMMIT');
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error unassigning VLAN:', error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
}; 