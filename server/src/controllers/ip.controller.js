const pool = require('../config/db');

exports.getIPBlocks = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT ip_blocks.id, ip_blocks.block, regions.name AS regionName
        FROM ip_blocks
        JOIN regions ON ip_blocks.region_id = regions.id
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching IP blocks:', error);
      res.status(500).json({ error: error.message });
    }
  };
  exports.createIPBlock = async (req, res) => {
    const { block, regionId } = req.body; // Ensure these fields are correctly extracted
    try {
      const result = await pool.query(
        'INSERT INTO ip_blocks (block, region_id) VALUES ($1, $2) RETURNING *',
        [block, regionId] // Ensure these values are correctly passed
      );
      res.status(201).json(result.rows[0]);
      console.log('Incoming data:', req.body);
    } catch (error) {
      console.error('Error creating IP block:', error);
      res.status(500).json({ error: error.message });
    }
  };


exports.deleteIPBlock = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM ip_blocks WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};