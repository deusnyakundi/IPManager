const pool = require('../config/db');
const { calculateNextAvailableIP } = require('../utils/ipUtils');

const assignIP = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { siteName, regionId } = req.body;
    
    // Get available IP range for the region
    const ipRangeResult = await client.query(
      'SELECT * FROM ip_ranges WHERE region_id = $1 AND is_active = true',
      [regionId]
    );
    
    if (ipRangeResult.rows.length === 0) {
      throw new Error('No available IP ranges for this region');
    }
    
    // Get available VCID range
    const vcidResult = await client.query(
      'SELECT * FROM vcid_ranges WHERE region_id = $1',
      [regionId]
    );
    
    if (vcidResult.rows.length === 0) {
      throw new Error('No VCID ranges defined for this region');
    }
    
    // Calculate next available IP and IDs
    const nextIP = await calculateNextAvailableIP(client, ipRangeResult.rows[0]);
    const primaryVCID = await getNextAvailableID(client, 'primary_vcid', regionId);
    const secondaryVCID = await getNextAvailableID(client, 'secondary_vcid', regionId);
    const vsiID = await getNextAvailableID(client, 'vsi_id', regionId);
    
    // Create assignment
    const result = await client.query(
      `INSERT INTO ip_assignments 
       (site_name, region_id, assigned_ip, management_vlan, primary_vcid, 
        secondary_vcid, vsi_id, assigned_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [siteName, regionId, nextIP, generateVLAN(), primaryVCID, 
       secondaryVCID, vsiID, req.user.id]
    );
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

module.exports = { assignIP }; 