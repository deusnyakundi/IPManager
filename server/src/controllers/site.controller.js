const pool = require('../config/database');
const logger = require('../services/logger.service');

const siteController = {
  // Get all sites
  getAllSites: async (req, res) => {
    try {
      const { search, region_ids, status } = req.query;
      
      let query = `
        SELECT 
          s.id,
          s.name,
          s.ip as "ipAddress",
          s.region_id as "regionId",
          r.name as "regionName",
          s.msp,
          s.ipran_cluster as "ipranCluster"
        FROM sites s 
        LEFT JOIN regions r ON s.region_id = r.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      if (search) {
        query += ` AND (s.name ILIKE $${paramIndex} OR s.ip ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      if (region_ids) {
        const regionIdArray = region_ids.split(',').map(Number);
        query += ` AND s.region_id = ANY($${paramIndex}::int[])`;
        params.push(regionIdArray);
        paramIndex++;
      }
      
      if (status === 'active') {
        query += ` AND s.ip IS NOT NULL`;
      } else if (status === 'pending') {
        query += ` AND s.ip IS NULL`;
      }
      
      query += ` ORDER BY s.name`;
      
      const result = await pool.query(query, params);
      
      const sites = result.rows.map(site => ({
        id: site.id,
        name: site.name,
        ipAddress: site.ipAddress,
        regionId: site.regionId,
        region: site.regionName ? {
          id: site.regionId,
          name: site.regionName
        } : null,
        msp: site.msp,
        ipranCluster: site.ipranCluster
      }));
      
      res.json(sites);
    } catch (error) {
      console.error('Error getting sites:', error);
      res.status(500).json({ message: 'Error getting sites' });
    }
  },

  // Create a new site
  createSite: async (req, res) => {
    const { name, ip, region_id, msp, ipran_cluster } = req.body;
    
    // Sanitize the site name - remove special characters and normalize
    const sanitizedName = name
      .normalize('NFKD')
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .replace(/\s+/g, '_')         // Replace spaces with underscores
      .trim();                      // Remove leading/trailing spaces

    logger.info('Site creation attempt', {
      originalName: name,
      ip: ip,
      regionId: region_id,
      msp: msp,
      ipranCluster: ipran_cluster,
      requestBody: req.body,
      timestamp: new Date()
    });

    try {
      // For site codes (matches pattern like 12087_NE_NM3236), get the base code
      const siteCodeMatch = sanitizedName.match(/^\d+_[A-Z]+_[A-Z]+\d+/);
      
      let existingSite;
      if (siteCodeMatch) {
        // If it's a site code, check if the base code exists
        const siteCode = siteCodeMatch[0];
        existingSite = await pool.query(
          `SELECT name FROM sites WHERE name LIKE $1 || '%'`,
          [siteCode]
        );

        if (existingSite.rows.length > 0) {
          logger.warn('Duplicate site creation attempted', {
            attemptedName: sanitizedName,
            existingSite: existingSite.rows[0].name,
            siteCode: siteCode,
            timestamp: new Date()
          });
          return res.status(400).json({ 
            message: `Site with code ${siteCode} already exists`
          });
        }
      } else {
        // For non-site-code names, check exact match
        existingSite = await pool.query(
          `SELECT name FROM sites WHERE name = $1`,
          [sanitizedName]
        );

        if (existingSite.rows.length > 0) {
          logger.warn('Duplicate site creation attempted', {
            attemptedName: sanitizedName,
            existingSite: existingSite.rows[0].name,
            timestamp: new Date()
          });
          return res.status(400).json({ 
            message: `Site "${sanitizedName}" already exists`
          });
        }
      }

      const result = await pool.query(
        `INSERT INTO sites (name, ip, region_id, msp, ipran_cluster) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [sanitizedName, ip, region_id, msp, ipran_cluster]
      );

      logger.info('Site created successfully', {
        siteName: sanitizedName,
        siteId: result.rows[0].id,
        msp: msp,
        ipranCluster: ipran_cluster,
        timestamp: new Date()
      });

      res.status(201).json(result.rows[0]);
    } catch (error) {
      logger.error('Error creating site', {
        error: error.message,
        stack: error.stack,
        siteName: sanitizedName,
        timestamp: new Date()
      });
      
      // Improve error message for the user
      let userMessage = 'Error creating site';
      if (error.message.includes('violates not-null constraint')) {
        userMessage = 'IP address is required for this operation';
      }
      
      res.status(500).json({ 
        message: userMessage,
        error: error.message 
      });
    }
  },

  // Update a site
  updateSite: async (req, res) => {
    const { id } = req.params;
    const { name, ipAddress, region_id, msp, ipran_cluster } = req.body;
    try {
      const result = await pool.query(
        `UPDATE sites 
         SET name = $1, ip = $2, region_id = $3, msp = $4, ipran_cluster = $5 
         WHERE id = $6 RETURNING *`,
        [name, ipAddress, region_id, msp, ipran_cluster, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Site not found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating site:', error);
      res.status(500).json({ message: 'Error updating site' });
    }
  },

  // Delete a site
  deleteSite: async (req, res) => {
    const { id } = req.params;
    try {
      // Start transaction
      await pool.query('BEGIN');

      // Get site details before deletion
      const siteResult = await pool.query(
        'SELECT name, region_id FROM sites WHERE id = $1',
        [id]
      );
      
      if (siteResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ message: 'Site not found' });
      }

      const site = siteResult.rows[0];
      const oltSiteName = `${site.name}-OLT`;

      // Get IP assignment details
      const assignmentResult = await pool.query(
        'SELECT management_vlan FROM ip_assignments WHERE site_name = $1',
        [oltSiteName]
      );

      if (assignmentResult.rows.length > 0) {
        const { management_vlan } = assignmentResult.rows[0];

        // Release VLAN
        await pool.query(
          'DELETE FROM vlans WHERE vlan = $1 AND region_id = $2',
          [management_vlan, site.region_id]
        );

        // Release IP assignment
        await pool.query(
          'DELETE FROM ip_assignments WHERE site_name = $1',
          [oltSiteName]
        );
      }

      // Delete the site
      const result = await pool.query(
        'DELETE FROM sites WHERE id = $1 RETURNING *',
        [id]
      );

      // Commit transaction
      await pool.query('COMMIT');

      res.json({ message: 'Site deleted successfully' });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error deleting site:', error);
      res.status(500).json({ message: 'Error deleting site' });
    }
  },

  // Generate IP for site
  generateIPForSite: async (req, res) => {
    try {
      // Log the incoming request body
      console.log('Received request body:', req.body);
      
      const { siteId } = req.body;
      if (!siteId) {
        return res.status(400).json({ message: 'Site ID is required' });
      }

      // First get the site and its region
      const siteResult = await pool.query(
        'SELECT s.*, r.name as region_name FROM sites s LEFT JOIN regions r ON s.region_id = r.id WHERE s.id = $1',
        [siteId]
      );
      
      if (siteResult.rows.length === 0) {
        return res.status(404).json({ message: 'Site not found' });
      }
      
      const site = siteResult.rows[0];

      // Check for existing OLT assignments
      const existingOLTs = await pool.query(
        `SELECT site_name FROM ip_assignments 
         WHERE site_name LIKE $1 || '-OLT%'`,
        [site.name]
      );

      let oltSiteName;
      if (existingOLTs.rows.length > 0) {
        if (existingOLTs.rows.length === 2) {
          return res.status(400).json({ 
            message: 'Maximum number of devices (2) already assigned to this site. Consider an upgrade.' 
          });
        }
        // If we have one device, add the second one with OLT02
        oltSiteName = `${site.name}-OLT02`;
      } else {
        // First device
        oltSiteName = `${site.name}-OLT`;
      }

      // Get available IP block for the region
      const ipBlockResult = await pool.query(
        `SELECT 
          id,
          block,
          region_id,
          network(block::cidr) as start_ip,
          broadcast(block::cidr) as end_ip
        FROM ip_blocks 
        WHERE region_id = $1 
        -- Get blocks that still have available IPs
        AND EXISTS (
          WITH RECURSIVE subnet_series AS (
            SELECT host((block::inet + 0)) as ip
            UNION ALL
            SELECT host((block::inet + (n.i * 4)))::text as ip
            FROM generate_series(1, 63) n(i)
          )
          SELECT 1 FROM subnet_series ss
          WHERE NOT EXISTS (
            SELECT 1 FROM ip_assignments ia
            WHERE (ia.assigned_ip::inet = (ss.ip::inet + 1) 
            OR ia.assigned_ip::inet = (ss.ip::inet + 2))
          )
          LIMIT 1
        )
        LIMIT 1`,
        [site.region_id]
      );
      
      console.log('Checking IP blocks for region:', site.region_id);
      console.log('IP Block Query Result:', ipBlockResult.rows);
      
      // Log existing assignments in this region
      const existingAssignments = await pool.query(
        `SELECT assigned_ip, site_name 
         FROM ip_assignments 
         WHERE region_id = $1 
         ORDER BY assigned_ip::inet`,
        [site.region_id]
      );
      console.log('Existing assignments in region:', existingAssignments.rows);
      
      if (ipBlockResult.rows.length === 0) {
        return res.status(400).json({ 
          message: `No available IP blocks for region ${site.region_id}. Please configure IP blocks first.`
        });
      }
      
      // Get available VLAN for the region
      const vlanResult = await pool.query(
        `SELECT vr.* FROM vlan_ranges vr 
         WHERE vr.region_id = $1 
         AND EXISTS (
           SELECT 1 FROM generate_series(vr.start_vlan, vr.end_vlan) AS v(vlan)
           WHERE NOT EXISTS (
             SELECT 1 FROM vlans 
             WHERE vlan = v.vlan AND is_assigned = true
           )
           LIMIT 1
         )
         LIMIT 1`,
        [site.region_id]
      );
      
      if (vlanResult.rows.length === 0) {
        return res.status(400).json({ message: 'No available VLAN ranges for this region' });
      }
      
      // Generate next available IP from the range
      const ipRange = ipBlockResult.rows[0];
      console.log('Selected IP block:', ipRange);
      
      const nextIPResult = await pool.query(
        `WITH RECURSIVE 
         subnet_series AS (
           SELECT host(($1::inet + 0)) as ip
           UNION ALL
           SELECT host(($1::inet + (n.i * 4)))::text as ip
           FROM generate_series(1, 63) n(i)
         ),
         used_ips AS (
           SELECT assigned_ip as ip 
           FROM ip_assignments 
           WHERE assigned_ip::inet << $1::inet
         )
         SELECT 
           ss.ip as network,
           host((ss.ip::inet + 1)::inet) as next_ip,
           host((ss.ip::inet + 3)::inet) as broadcast
         FROM subnet_series ss
         WHERE NOT EXISTS (
           SELECT 1 FROM used_ips ui
           WHERE (ui.ip::inet = (ss.ip::inet + 1) OR ui.ip::inet = (ss.ip::inet + 2))
         )
         ORDER BY ss.ip::inet
         LIMIT 1`,
        [ipRange.block]
      );
      
      console.log('Next IP Result:', nextIPResult.rows);

      if (!nextIPResult.rows.length) {
        return res.status(400).json({ message: 'No available /30 subnets in the IP range' });
      }

      const { next_ip, network, broadcast } = nextIPResult.rows[0];
      console.log('Allocated subnet:', {
        network,
        assigned_ip: next_ip,
        broadcast,
        mask: '/30'
      });

      // Generate next available VLAN from the range
      const vlanRange = vlanResult.rows[0];
      console.log('Selected VLAN range:', vlanRange);

      const nextVLANResult = await pool.query(
        `SELECT v.vlan
         FROM generate_series($1::integer, $2::integer) AS v(vlan)
         WHERE NOT EXISTS (
           SELECT 1 FROM vlans 
           WHERE vlan = v.vlan AND is_assigned = true
         )
         LIMIT 1`,
        [vlanRange.start_vlan, vlanRange.end_vlan]
      );
      
      console.log('Next VLAN Result:', nextVLANResult.rows);

      if (!nextIPResult.rows.length || !nextVLANResult.rows.length) {
        return res.status(400).json({ message: 'No available IP or VLAN in the ranges' });
      }
      
      const nextIP = nextIPResult.rows[0].next_ip;
      const nextVLAN = nextVLANResult.rows[0].vlan;
      
      // Get VCID ranges for the region
      const vcidRangeResult = await pool.query(
        `SELECT * FROM vcid_ranges 
         WHERE region_id = $1 
         AND EXISTS (
           SELECT 1 
           FROM generate_series(start_primary_vcid, end_primary_vcid) AS p(vcid)
           WHERE NOT EXISTS (
             SELECT 1 FROM ip_assignments 
             WHERE primary_vcid = p.vcid
           )
         )
         AND EXISTS (
           SELECT 1 
           FROM generate_series(start_secondary_vcid, end_secondary_vcid) AS s(vcid)
           WHERE NOT EXISTS (
             SELECT 1 FROM ip_assignments 
             WHERE secondary_vcid = s.vcid
           )
         )
         AND EXISTS (
           SELECT 1 
           FROM generate_series(start_vsi_id, end_vsi_id) AS v(vsi)
           WHERE NOT EXISTS (
             SELECT 1 FROM ip_assignments 
             WHERE vsi_id = v.vsi
           )
         )
         LIMIT 1`,
        [site.region_id]
      );

      if (vcidRangeResult.rows.length === 0) {
        return res.status(400).json({ 
          message: 'No available VCID ranges for this region or all VCIDs are in use' 
        });
      }

      const vcidRange = vcidRangeResult.rows[0];

      // Get next available VCIDs and VSI
      const [primaryVCID, secondaryVCID, vsiId] = await Promise.all([
        pool.query(
          `SELECT vcid FROM generate_series($1::integer, $2::integer) AS p(vcid)
           WHERE NOT EXISTS (
             SELECT 1 FROM ip_assignments WHERE primary_vcid = p.vcid
           ) LIMIT 1`,
          [vcidRange.start_primary_vcid, vcidRange.end_primary_vcid]
        ),
        pool.query(
          `SELECT vcid FROM generate_series($1::integer, $2::integer) AS s(vcid)
           WHERE NOT EXISTS (
             SELECT 1 FROM ip_assignments WHERE secondary_vcid = s.vcid
           ) LIMIT 1`,
          [vcidRange.start_secondary_vcid, vcidRange.end_secondary_vcid]
        ),
        pool.query(
          `SELECT vsi FROM generate_series($1::integer, $2::integer) AS v(vsi)
           WHERE NOT EXISTS (
             SELECT 1 FROM ip_assignments WHERE vsi_id = v.vsi
           ) LIMIT 1`,
          [vcidRange.start_vsi_id, vcidRange.end_vsi_id]
        )
      ]);

      // Create IP assignment with all generated values
      await pool.query(
        `INSERT INTO ip_assignments (
          site_name, region_id, assigned_ip, management_vlan, 
          primary_vcid, secondary_vcid, vsi_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          oltSiteName,
          site.region_id,
          nextIP,
          nextVLAN,
          primaryVCID.rows[0].vcid,
          secondaryVCID.rows[0].vcid,
          vsiId.rows[0].vsi
        ]
      );

      // Mark VLAN as assigned
      await pool.query(
        `INSERT INTO vlans (vlan, region_id, is_assigned)
         VALUES ($1, $2, true)`,
        [nextVLAN, site.region_id]
      );

      // Return all generated values
      res.json({
        site_name: oltSiteName,
        ip: nextIP,
        vlan: nextVLAN,
        primary_vcid: primaryVCID.rows[0].vcid,
        secondary_vcid: secondaryVCID.rows[0].vcid,
        vsi_id: vsiId.rows[0].vsi,
        region: site.region_name
      });

    } catch (error) {
      console.error('Error generating values:', error);
      res.status(500).json({ 
        message: 'Error generating values',
        error: error.message 
      });
    }
  }
};

module.exports = siteController;