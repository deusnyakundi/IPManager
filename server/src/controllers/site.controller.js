const { Pool } = require('pg');
const pool = require('../config/db');

// Function to assign a VLAN from a specified range
const assignVLANFromRange = async (regionId) => {
  // Fetch the VLAN range for the specified region
  const rangeResult = await pool.query(
    'SELECT start_vlan, end_vlan FROM vlan_ranges WHERE region_id = $1',
    [regionId]
  );

  if (rangeResult.rows.length === 0) {
    throw new Error('No VLAN range defined for this region');
  }

  const { start_vlan, end_vlan } = rangeResult.rows[0];

  // Fetch used VLANs from the sites table
  const usedVLANsResult = await pool.query(
    'SELECT vlan FROM sites WHERE region_id = $1',
    [regionId]
  );

  const usedVLANs = new Set(usedVLANsResult.rows.map(row => row.vlan));

  // Find the first available VLAN in the range
  for (let vlan = start_vlan; vlan <= end_vlan; vlan++) {
    if (!usedVLANs.has(vlan)) {
      // Mark this VLAN as assigned in the vlans table
      await pool.query(
        'INSERT INTO vlans (vlan, region_id, is_assigned) VALUES ($1, $2, TRUE)',
        [vlan, regionId]
      );
      return vlan;
    }
  }

  throw new Error('No available VLANs in this range');
};
const findNextAvailableIP = async (blocks) => {
  for (const block of blocks) {
    const [network, cidr] = block.block.split('/');
    if (parseInt(cidr) !== 24) {
      console.log('Block is not a /24, skipping:', block.block);
      continue;
    }

    try {
      // Modified query to handle IP address casting correctly
      const nextAvailableSubnetQuery = `
        WITH RECURSIVE 
        subnet_series AS (
          SELECT host(($1::inet + 0)) as ip
          UNION ALL
          SELECT host(($1::inet + (n.i * 4)))::text as ip
          FROM generate_series(1, 63) n(i)
        ),
        used_ips AS (
          SELECT ip FROM sites WHERE ip::inet << $1::inet
        )
        SELECT ss.ip
        FROM subnet_series ss
        WHERE NOT EXISTS (
          SELECT 1 FROM used_ips ui
          WHERE (ui.ip::inet = (ss.ip::inet + 1) OR ui.ip::inet = (ss.ip::inet + 2))
        )
        ORDER BY ss.ip::inet
        LIMIT 1;
      `;

      const result = await pool.query(nextAvailableSubnetQuery, [block.block]);
      
      if (result.rows.length > 0) {
        const nextSubnet = result.rows[0].ip;
        // Calculate the first usable IP (subnet + 1)
        const firstUsableIP = `${nextSubnet.split('.').slice(0, -1).join('.')}.${parseInt(nextSubnet.split('.')[3]) + 1}`;
        console.log('Found next available /30 subnet starting at:', nextSubnet);
        console.log('First usable IP:', firstUsableIP);
        return firstUsableIP;
      }
    } catch (error) {
      console.error('Error finding next available subnet:', error);
      continue;
    }
  }
  
  console.log('No available /30 subnets found in any block');
  return null;
};

// Helper functions
const intToIP = (int) => {
  return [
    (int >> 24) & 255,
    (int >> 16) & 255,
    (int >> 8) & 255,
    int & 255
  ].join('.');
};

const ipToInt = (ip) => {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
};



exports.generateIPForSite = async (req, res) => {
  const { siteName, regionId } = req.body;
  console.log('generateIPForSite called with:', req.body);
  
  try {
    // Start a database transaction
    await pool.query('BEGIN');

    const blocksResult = await pool.query(
      'SELECT block FROM ip_blocks WHERE region_id = $1',
      [regionId]
    );
    console.log('IP blocks for region:', blocksResult.rows);

    if (blocksResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'No IP blocks defined for this region' });
    }

    const availableIP = await findNextAvailableIP(blocksResult.rows);

    if (!availableIP) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'No available IPs in this region' });
    }

    const vlan = await assignVLANFromRange(regionId);

    // Insert the new site with the assigned IP and VLAN
    await pool.query(
      'INSERT INTO sites (name, ip, region_id, vlan) VALUES ($1, $2, $3, $4)',
      [siteName, availableIP, regionId, vlan]
    );

    // Commit the transaction
    await pool.query('COMMIT');

    res.json({ siteName, ip: availableIP, vlan });
  } catch (error) {
    // Rollback the transaction in case of any error
    await pool.query('ROLLBACK');
    console.error('Error generating IP:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllSites = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sites');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSite = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sites WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ error: error.message });
  }
};