const pool = require('../config/db');

exports.getVCIDRanges = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vr.*, r.name as region_name 
       FROM vcid_ranges vr 
       LEFT JOIN regions r ON vr.region_id = r.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting VCID ranges:', error);
    res.status(500).json({ message: 'Error getting VCID ranges' });
  }
};

exports.createVCIDRange = async (req, res) => {
  const { 
    region_id, 
    start_primary_vcid, 
    end_primary_vcid,
    start_secondary_vcid,
    end_secondary_vcid,
    start_vsi_id,
    end_vsi_id
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO vcid_ranges (
        region_id, 
        start_primary_vcid, 
        end_primary_vcid,
        start_secondary_vcid,
        end_secondary_vcid,
        start_vsi_id,
        end_vsi_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        region_id, 
        start_primary_vcid, 
        end_primary_vcid,
        start_secondary_vcid,
        end_secondary_vcid,
        start_vsi_id,
        end_vsi_id
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating VCID range:', error);
    res.status(500).json({ message: 'Error creating VCID range' });
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