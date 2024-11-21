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
    const subnetSize = Math.pow(2, 32 - parseInt(cidr));
    const networkParts = network.split('.').map(Number);

    // Calculate the range of IPs in this block
    const startIP = (networkParts[0] << 24) | (networkParts[1] << 16) | (networkParts[2] << 8) | networkParts[3];
    const endIP = startIP + subnetSize - 1;

    // Fetch used IPs in this block
    const usedIPsResult = await pool.query(
      'SELECT ip FROM sites WHERE ip BETWEEN $1 AND $2',
      [intToIP(startIP + 1), intToIP(endIP - 1)]
    );

    const usedIPs = new Set(usedIPsResult.rows.map(row => ipToInt(row.ip)));
    console.log('Checking IP block:', block.block);
    console.log('Used IPs:', Array.from(usedIPs).map(intToIP));

    // Find the next available IP
    for (let ip = startIP + 1; ip < endIP; ip++) {
      if (!usedIPs.has(ip)) {
        console.log('Found available IP:', intToIP(ip));
        return intToIP(ip);
      }
    }
  }
  console.log('No available IPs found in any block');
  return null; // No available IPs
};

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
    const blocksResult = await pool.query(
      'SELECT block FROM ip_blocks WHERE region_id = $1',
      [regionId]
    );
    console.log('IP blocks for region:', blocksResult.rows);

    const availableIP = await findNextAvailableIP(blocksResult.rows);

    if (!availableIP) {
      return res.status(400).json({ error: 'No available IPs in this region' });
    }

    const vlan = await assignVLANFromRange(regionId);

    await pool.query(
      'INSERT INTO sites (name, ip, region_id, vlan) VALUES ($1, $2, $3, $4)',
      [siteName, availableIP, regionId, vlan]
    );

    res.json({ siteName, ip: availableIP, vlan });
  } catch (error) {
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