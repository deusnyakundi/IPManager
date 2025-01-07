const pool = require('../config/db');

const addIPRange = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { regionId, startIP, endIP } = req.body;
    
    const result = await client.query(
      'INSERT INTO ip_ranges (region_id, start_ip, end_ip) VALUES ($1, $2, $3) RETURNING *',
      [regionId, startIP, endIP]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

const addVCIDRange = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      regionId,
      startPrimaryVcid,
      endPrimaryVcid,
      startSecondaryVcid,
      endSecondaryVcid,
      startVsiId,
      endVsiId
    } = req.body;
    
    const result = await client.query(
      `INSERT INTO vcid_ranges 
       (region_id, start_primary_vcid, end_primary_vcid, 
        start_secondary_vcid, end_secondary_vcid,
        start_vsi_id, end_vsi_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [regionId, startPrimaryVcid, endPrimaryVcid,
       startSecondaryVcid, endSecondaryVcid,
       startVsiId, endVsiId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

const addRegion = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { name } = req.body;
    
    const result = await client.query(
      'INSERT INTO regions (name) VALUES ($1) RETURNING *',
      [name]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  addIPRange,
  addVCIDRange,
  addRegion
}; 