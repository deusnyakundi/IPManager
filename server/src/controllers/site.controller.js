const pool = require('../config/db');
const logger = require('../services/logger.service');
const xlsx = require('xlsx');

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
          s.msp_id,
          m.name as "mspName",
          s.ipran_cluster_id,
          ic.name as "ipranCluster"
        FROM sites s 
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN msps m ON s.msp_id = m.id
        LEFT JOIN ipran_clusters ic ON s.ipran_cluster_id = ic.id
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
        mspId: site.msp_id,
        msp: site.mspName ? {
          id: site.msp_id,
          name: site.mspName
        } : null,
        ipranClusterId: site.ipran_cluster_id,
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { 
        name, 
        region_id,
        regionId,
        msp_id,
        mspId,
        ipran_cluster_id,
        ipranClusterId,
        ip,
        ipAddress
      } = req.body;

      // Use the appropriate field names
      const finalRegionId = region_id || regionId;
      const finalMspId = msp_id || mspId;
      const finalIpranClusterId = ipran_cluster_id || ipranClusterId;
      const finalIp = ip || ipAddress;

      // Validate required fields
      if (!name || !finalRegionId) {
        throw new Error('Name and region are required');
      }

      // Check if site exists by IP
      let existingSite = null;
      if (finalIp) {
        const ipCheck = await client.query(
          'SELECT * FROM sites WHERE ip = $1',
          [finalIp]
        );
        if (ipCheck.rows.length > 0) {
          existingSite = ipCheck.rows[0];
        }
      }

      let result;
      if (existingSite) {
        // Update existing site
        result = await client.query(
          `UPDATE sites 
           SET name = $1,
               ip = $2,
               region_id = $3,
               msp_id = $4,
               ipran_cluster_id = $5
           WHERE id = $6
           RETURNING *`,
          [
            name,
            finalIp,
            finalRegionId,
            finalMspId,
            finalIpranClusterId,
            existingSite.id
          ]
        );
      } else {
        // Create the site
        result = await client.query(
          `INSERT INTO sites (
            name, 
            region_id, 
            msp_id,
            ipran_cluster_id,
            ip
          ) VALUES ($1, $2, $3, $4, $5) 
          RETURNING *`,
          [name, finalRegionId, finalMspId, finalIpranClusterId, finalIp]
        );
      }

      // Get complete site info with related data
      const siteResult = await client.query(`
        SELECT 
          s.*,
          r.name as region_name,
          m.name as msp_name,
          ic.name as ipran_cluster_name
        FROM sites s
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN msps m ON s.msp_id = m.id
        LEFT JOIN ipran_clusters ic ON s.ipran_cluster_id = ic.id
        WHERE s.id = $1
      `, [result.rows[0].id]);

      await client.query('COMMIT');

      const site = siteResult.rows[0];
      res.status(201).json({
        id: site.id,
        name: site.name,
        regionId: site.region_id,
        region: site.region_name ? {
          id: site.region_id,
          name: site.region_name
        } : null,
        mspId: site.msp_id,
        msp: site.msp_name,
        ipranClusterId: site.ipran_cluster_id,
        ipranCluster: site.ipran_cluster_name,
        ipAddress: site.ip
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating site:', error);
      res.status(400).json({ 
        message: 'Error creating site', 
        error: error.message 
      });
    } finally {
      client.release();
    }
  },

  // Update a site
  updateSite: async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { 
        name, 
        ip,
        region_id, 
        msp_id, 
        ipran_cluster_id 
      } = req.body;

      // First check if site exists
      const siteCheck = await client.query(
        'SELECT id FROM sites WHERE id = $1',
        [id]
      );

      if (siteCheck.rows.length === 0) {
        throw new Error('Site not found');
      }

      // Update the site
      const result = await client.query(
        `UPDATE sites 
         SET name = $1, 
             ip = $2, 
             region_id = $3, 
             msp_id = $4, 
             ipran_cluster_id = $5
         WHERE id = $6 
         RETURNING *`,
        [name, ip, region_id, msp_id, ipran_cluster_id, id]
      );

      // Get complete site info with related data
      const siteResult = await client.query(`
        SELECT 
          s.*,
          r.name as region_name,
          m.name as msp_name,
          ic.name as ipran_cluster_name
        FROM sites s
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN msps m ON s.msp_id = m.id
        LEFT JOIN ipran_clusters ic ON s.ipran_cluster_id = ic.id
        WHERE s.id = $1
      `, [result.rows[0].id]);

      await client.query('COMMIT');

      const site = siteResult.rows[0];
      res.json({
        id: site.id,
        name: site.name,
        ip: site.ip,
        regionId: site.region_id,
        region: site.region_name ? {
          id: site.region_id,
          name: site.region_name
        } : null,
        mspId: site.msp_id,
        msp: site.msp_name ? {
          id: site.msp_id,
          name: site.msp_name
        } : null,
        ipranClusterId: site.ipran_cluster_id,
        ipranCluster: site.ipran_cluster_name
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating site:', error);
      res.status(500).json({ 
        message: 'Error updating site',
        error: error.message 
      });
    } finally {
      client.release();
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
      console.log('Received request body:', req.body);
      
      const { siteId } = req.body;
      if (!siteId) {
        return res.status(400).json({ message: 'Site ID is required' });
      }

      // Get site and its IPRAN cluster
      const siteResult = await pool.query(
        `SELECT s.*, ic.name as cluster_name 
         FROM sites s 
         LEFT JOIN ipran_clusters ic ON s.ipran_cluster_id = ic.id 
         WHERE s.id = $1`,
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
        oltSiteName = `${site.name}-OLT02`;
      } else {
        oltSiteName = `${site.name}-OLT`;
      }

      // Get available IP block for the IPRAN cluster
      const ipBlockResult = await pool.query(
        `SELECT 
          id,
          block,
          ipran_cluster_id,
          network(block::cidr) as start_ip,
          broadcast(block::cidr) as end_ip
        FROM ip_blocks 
        WHERE ipran_cluster_id = $1 
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
        [site.ipran_cluster_id]
      );
      
      console.log('IP Block Query Result:', ipBlockResult.rows);
      
      const existingAssignments = await pool.query(
        `SELECT assigned_ip, site_name 
         FROM ip_assignments 
         WHERE ipran_cluster_id = $1 
         ORDER BY assigned_ip::inet`,
        [site.ipran_cluster_id]
      );
      console.log('Existing assignments in cluster:', existingAssignments.rows);
      
      if (ipBlockResult.rows.length === 0) {
        return res.status(400).json({ 
          message: `No available IP blocks for IPRAN cluster ${site.cluster_name}. Please configure IP blocks first.`
        });
      }
      
      // Get available VLAN for the IPRAN cluster
      const vlanResult = await pool.query(
        `SELECT vr.* FROM vlan_ranges vr 
         WHERE vr.ipran_cluster_id = $1 
         AND EXISTS (
           SELECT 1 FROM generate_series(vr.start_vlan, vr.end_vlan) AS v(vlan)
           WHERE NOT EXISTS (
             SELECT 1 FROM ip_assignments 
             WHERE management_vlan = v.vlan 
             AND ipran_cluster_id = $1
           )
           LIMIT 1
         )
         LIMIT 1`,
        [site.ipran_cluster_id]
      );
      
      if (vlanResult.rows.length === 0) {
        return res.status(400).json({ message: 'No available VLAN ranges for this IPRAN cluster' });
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

      if (!nextIPResult.rows.length) {
        return res.status(400).json({ message: 'No available /30 subnets in the IP range' });
      }

      const { next_ip } = nextIPResult.rows[0];

      // Generate next available VLAN
      const vlanRange = vlanResult.rows[0];
      const nextVLANResult = await pool.query(`
        WITH cluster_range AS (
          -- Get the valid range for this cluster
          SELECT 
            start_vlan,
            end_vlan
          FROM vlan_ranges 
          WHERE ipran_cluster_id = $1
        ),
        used_vlans AS (
          -- Get ALL used VLANs across ALL clusters for global uniqueness
          SELECT DISTINCT management_vlan 
          FROM ip_assignments
        ),
        available_vlans AS (
          -- Generate series within cluster's range
          SELECT v.vlan_number
          FROM cluster_range cr,
               generate_series(cr.start_vlan, cr.end_vlan) AS v(vlan_number)
          -- Exclude globally used VLANs
          WHERE v.vlan_number NOT IN (SELECT management_vlan FROM used_vlans)
        )
        SELECT vlan_number as vlan
        FROM available_vlans
        ORDER BY vlan_number
        LIMIT 1`,
        [site.ipran_cluster_id]
      );

      if (!nextVLANResult.rows.length) {
        return res.status(400).json({ 
          message: 'No available VLANs in the assigned range for this IPRAN cluster' 
        });
      }

      const nextVLAN = nextVLANResult.rows[0].vlan;

      // Get VCID ranges and generate next available VCIDs
      const vcidRangeResult = await pool.query(
        'SELECT * FROM vcid_ranges WHERE ipran_cluster_id = $1 LIMIT 1',
        [site.ipran_cluster_id]
      );

      if (vcidRangeResult.rows.length === 0) {
        return res.status(400).json({ message: 'No VCID ranges defined for this IPRAN cluster' });
      }

      const vcidRange = vcidRangeResult.rows[0];

      // Get next available VCIDs and VSI
      const [primaryVCID, secondaryVCID, vsiId] = await Promise.all([
        pool.query(`
          WITH cluster_range AS (
            SELECT 
              start_primary_vcid,
              end_primary_vcid
            FROM vcid_ranges 
            WHERE ipran_cluster_id = $1
          ),
          used_vcids AS (
            -- Get ALL used VCIDs across ALL clusters
            SELECT DISTINCT primary_vcid 
            FROM ip_assignments 
          ),
          available_vcids AS (
          SELECT v.vcid
            FROM cluster_range cr,
                 generate_series(cr.start_primary_vcid, cr.end_primary_vcid) AS v(vcid)
          WHERE v.vcid NOT IN (SELECT primary_vcid FROM used_vcids)
          )
          SELECT vcid
          FROM available_vcids
          ORDER BY vcid
          LIMIT 1`,
          [site.ipran_cluster_id]
        ),
        pool.query(`
          WITH cluster_range AS (
            SELECT 
              start_secondary_vcid,
              end_secondary_vcid
            FROM vcid_ranges 
            WHERE ipran_cluster_id = $1
          ),
          used_vcids AS (
            -- Get ALL used secondary VCIDs across ALL clusters
            SELECT DISTINCT secondary_vcid 
            FROM ip_assignments 
          ),
          available_vcids AS (
          SELECT v.vcid
            FROM cluster_range cr,
                 generate_series(cr.start_secondary_vcid, cr.end_secondary_vcid) AS v(vcid)
          WHERE v.vcid NOT IN (SELECT secondary_vcid FROM used_vcids)
          )
          SELECT vcid
          FROM available_vcids
          ORDER BY vcid
          LIMIT 1`,
          [site.ipran_cluster_id]
        ),
        pool.query(`
          WITH cluster_range AS (
            SELECT 
              start_vsi_id,
              end_vsi_id
            FROM vcid_ranges 
            WHERE ipran_cluster_id = $1
          ),
          used_vsis AS (
            -- Get ALL used VSI IDs across ALL clusters
            SELECT DISTINCT vsi_id 
            FROM ip_assignments 
          ),
          available_vsis AS (
          SELECT v.vsi
            FROM cluster_range cr,
                 generate_series(cr.start_vsi_id, cr.end_vsi_id) AS v(vsi)
          WHERE v.vsi NOT IN (SELECT vsi_id FROM used_vsis)
          )
          SELECT vsi
          FROM available_vsis
          ORDER BY vsi
          LIMIT 1`,
          [site.ipran_cluster_id]
        )
      ]);

      // Create IP assignment
      await pool.query(
        `INSERT INTO ip_assignments (
          site_name,
          ipran_cluster_id,
          assigned_ip,
          management_vlan,
          primary_vcid,
          secondary_vcid,
          vsi_id,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          oltSiteName,
          site.ipran_cluster_id,
          next_ip,
          nextVLAN,
          primaryVCID.rows[0].vcid,
          secondaryVCID.rows[0].vcid,
          vsiId.rows[0].vsi
        ]
      );

      // Return all generated values
      res.json({
        site_name: oltSiteName,
        ip: next_ip,
        vlan: nextVLAN,
        primary_vcid: primaryVCID.rows[0].vcid,
        secondary_vcid: secondaryVCID.rows[0].vcid,
        vsi_id: vsiId.rows[0].vsi,
        ipran_cluster: site.cluster_name
      });

    } catch (error) {
      console.error('Error generating values:', error);
      res.status(500).json({ 
        message: 'Error generating values',
        error: error.message 
      });
    }
  },

  // Generate IP for site
  generateIP: async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { 
        site_name, 
        ipran_cluster_id,  // Changed from region_id
        msp_id 
      } = req.body;

      // Validate IPRAN cluster exists
      const clusterCheck = await client.query(
        'SELECT id FROM ipran_clusters WHERE id = $1',
        [ipran_cluster_id]
      );

      if (clusterCheck.rows.length === 0) {
        throw new Error('Invalid IPRAN cluster');
      }

      // Get available VLAN from the cluster's ranges
      const vlanResult = await client.query(`
        SELECT v.vlan
        FROM generate_series(
          (SELECT MIN(start_vlan) FROM vlan_ranges WHERE ipran_cluster_id = $1),
          (SELECT MAX(end_vlan) FROM vlan_ranges WHERE ipran_cluster_id = $1)
        ) AS s(vlan)
        LEFT JOIN vlans v ON v.vlan = s.vlan AND v.ipran_cluster_id = $1
        WHERE v.vlan IS NULL
        LIMIT 1`,
        [ipran_cluster_id]
      );

      if (vlanResult.rows.length === 0) {
        throw new Error('No available VLANs in the selected IPRAN cluster');
      }

      const vlan = vlanResult.rows[0].vlan;

      // Get available VCID from the cluster's ranges
      const vcidResult = await client.query(`
        SELECT s.vcid
        FROM generate_series(
          (SELECT MIN(start_primary_vcid) FROM vcid_ranges WHERE ipran_cluster_id = $1),
          (SELECT MAX(end_primary_vcid) FROM vcid_ranges WHERE ipran_cluster_id = $1)
        ) AS s(vcid)
        LEFT JOIN sites ON sites.primary_vcid = s.vcid AND sites.ipran_cluster_id = $1
        WHERE sites.primary_vcid IS NULL
        LIMIT 1`,
        [ipran_cluster_id]
      );

      if (vcidResult.rows.length === 0) {
        throw new Error('No available VCIDs in the selected IPRAN cluster');
      }

      const primary_vcid = vcidResult.rows[0].vcid;

      // Get secondary VCID
      const secondaryVcidResult = await client.query(`
        SELECT s.vcid
        FROM generate_series(
          (SELECT MIN(start_secondary_vcid) FROM vcid_ranges WHERE ipran_cluster_id = $1),
          (SELECT MAX(end_secondary_vcid) FROM vcid_ranges WHERE ipran_cluster_id = $1)
        ) AS s(vcid)
        LEFT JOIN sites ON sites.secondary_vcid = s.vcid AND sites.ipran_cluster_id = $1
        WHERE sites.secondary_vcid IS NULL
        LIMIT 1`,
        [ipran_cluster_id]
      );

      if (secondaryVcidResult.rows.length === 0) {
        throw new Error('No available secondary VCIDs in the selected IPRAN cluster');
      }

      const secondary_vcid = secondaryVcidResult.rows[0].vcid;

      // Get VSI ID
      const vsiResult = await client.query(`
        SELECT s.vsi_id
        FROM generate_series(
          (SELECT MIN(start_vsi_id) FROM vcid_ranges WHERE ipran_cluster_id = $1),
          (SELECT MAX(end_vsi_id) FROM vcid_ranges WHERE ipran_cluster_id = $1)
        ) AS s(vsi_id)
        LEFT JOIN sites ON sites.vsi_id = s.vsi_id AND sites.ipran_cluster_id = $1
        WHERE sites.vsi_id IS NULL
        LIMIT 1`,
        [ipran_cluster_id]
      );

      if (vsiResult.rows.length === 0) {
        throw new Error('No available VSI IDs in the selected IPRAN cluster');
      }

      const vsi_id = vsiResult.rows[0].vsi_id;

      // Create the site with generated values
      const result = await client.query(
        `INSERT INTO sites (
          site_name,
          ipran_cluster_id,
          msp_id,
          vlan,
          primary_vcid,
          secondary_vcid,
          vsi_id,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
        RETURNING *`,
        [
          site_name,
          ipran_cluster_id,
          msp_id,
          vlan,
          primary_vcid,
          secondary_vcid,
          vsi_id
        ]
      );

      // Mark the VLAN as assigned
      await client.query(
        'INSERT INTO vlans (vlan, ipran_cluster_id, is_assigned) VALUES ($1, $2, true)',
        [vlan, ipran_cluster_id]
      );

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error generating values:', error);
      res.status(400).json({ 
        message: 'Error generating values',
        error: error.message 
      });
    } finally {
      client.release();
    }
  },

  getSiteById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`
        SELECT 
          s.id,
          s.name,
          s.ip as "ipAddress",
          s.region_id as "regionId",
          r.name as "regionName",
          s.msp_id as "mspId",
          m.name as "mspName",
          s.ipran_cluster_id as "ipranClusterId",
          ic.name as "ipranCluster"
        FROM sites s
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN msps m ON s.msp_id = m.id
        LEFT JOIN ipran_clusters ic ON s.ipran_cluster_id = ic.id
        WHERE s.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Site not found' });
      }

      const site = result.rows[0];
      
      // Format response to match frontend expectations
      res.json({
        id: site.id,
        name: site.name,
        ipAddress: site.ipAddress,
        regionId: site.regionId,
        region: site.regionName ? {
          id: site.regionId,
          name: site.regionName
        } : null,
        mspId: site.mspId,
        msp: site.mspName ? {
          id: site.mspId,
          name: site.mspName
        } : null,
        ipranClusterId: site.ipranClusterId,
        ipranCluster: site.ipranCluster
      });

    } catch (error) {
      console.error('Error getting site:', error);
      res.status(500).json({ 
        message: 'Error getting site details',
        error: error.message  // Add error details for debugging
      });
    }
  },

  exportSites: async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          s.name as "Site Name",
          s.ip as "IP Address",
          r.name as "Region",
          m.name as "MSP",
          ic.name as "IPRAN Cluster"
        FROM sites s 
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN msps m ON s.msp_id = m.id
        LEFT JOIN ipran_clusters ic ON s.ipran_cluster_id = ic.id
        ORDER BY s.name
      `);

      if (result.rows.length === 0) {
        throw new Error('No sites found to export');
      }

      // Create workbook and worksheet
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(result.rows, {
        header: ['Site Name', 'IP Address', 'Region', 'MSP', 'IPRAN Cluster']
      });

      // Add worksheet to workbook
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Sites');

      // Generate buffer
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers for Excel file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sites-export.xlsx');

      // Send the Excel file
      res.send(buffer);

    } catch (error) {
      console.error('Error exporting sites:', error);
      res.status(500).json({ 
        message: 'Error exporting sites',
        error: error.message 
      });
    }
  },

  importSites: async (req, res) => {
    const client = await pool.connect();
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Parse Excel file
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const sites = xlsx.utils.sheet_to_json(worksheet);

      if (!sites || sites.length === 0) {
        return res.status(400).json({ message: 'No sites found in file' });
      }

      const results = [];
      const errors = [];

      // First, get all regions, MSPs, and IPRAN clusters to avoid multiple queries
      const regionsResult = await client.query('SELECT id, name FROM regions');
      const mspsResult = await client.query('SELECT id, name FROM msps');
      const clustersResult = await client.query('SELECT id, name FROM ipran_clusters');

      // Create lookup maps
      const regionMap = new Map(regionsResult.rows.map(r => [r.name.toLowerCase(), r.id]));
      const mspMap = new Map(mspsResult.rows.map(m => [m.name.toLowerCase(), m.id]));
      const clusterMap = new Map(clustersResult.rows.map(c => [c.name.toLowerCase(), c.id]));

      for (const site of sites) {
        try {
          await client.query('BEGIN');

          // Map Excel columns to site properties
          const siteData = {
            name: site['Site Name'] || site.name,
            ip: site['IP Address'] || site.ip,
            region: site['Region'] || site.region,
            msp: site['MSP'] || site.msp,
            ipranCluster: site['IPRAN Cluster'] || site.ipranCluster
          };

          // Look up IDs from the maps
          const region_id = siteData.region ? regionMap.get(siteData.region.toLowerCase()) : null;
          const msp_id = siteData.msp ? mspMap.get(siteData.msp.toLowerCase()) : null;
          const ipran_cluster_id = siteData.ipranCluster ? clusterMap.get(siteData.ipranCluster.toLowerCase()) : null;

          // Validate required relationships
          if (siteData.region && !region_id) {
            throw new Error(`Region "${siteData.region}" not found`);
          }

          // Check if site exists by IP
          let existingSite = null;
          if (siteData.ip) {
            const ipCheck = await client.query(
              'SELECT * FROM sites WHERE ip = $1',
              [siteData.ip]
            );
            if (ipCheck.rows.length > 0) {
              existingSite = ipCheck.rows[0];
            }
          }

          let result;
          if (existingSite) {
            // Update existing site
            result = await client.query(
              `UPDATE sites 
               SET name = $1,
                   ip = $2,
                   region_id = $3,
                   msp_id = $4,
                   ipran_cluster_id = $5
               WHERE id = $6
               RETURNING *`,
              [
                siteData.name,
                siteData.ip,
                region_id,
                msp_id,
                ipran_cluster_id,
                existingSite.id
              ]
            );
          } else {
            // Check if IP is already used by another site
            if (siteData.ip) {
              const ipUsed = await client.query(
                'SELECT id FROM sites WHERE ip = $1',
                [siteData.ip]
              );
              if (ipUsed.rows.length > 0) {
                throw new Error(`IP address ${siteData.ip} is already in use`);
              }
            }

            // Insert new site
            result = await client.query(
              `INSERT INTO sites (
                name,
                ip,
                region_id,
                msp_id,
                ipran_cluster_id
              ) VALUES ($1, $2, $3, $4, $5)
              RETURNING *`,
              [
                siteData.name,
                siteData.ip || null,
                region_id,
                msp_id,
                ipran_cluster_id
              ]
            );
          }

          await client.query('COMMIT');
          results.push(result.rows[0]);
        } catch (error) {
          await client.query('ROLLBACK');
          errors.push({ 
            site: site['Site Name'] || site.name || 'Unknown', 
            error: error.message,
            details: {
              providedRegion: site['Region'] || site.region,
              providedMSP: site['MSP'] || site.msp,
              providedCluster: site['IPRAN Cluster'] || site.ipranCluster,
              providedIP: site['IP Address'] || site.ip
            }
          });
        }
      }

      // Return results
      if (results.length > 0) {
        res.json({ 
          success: results,
          errors: errors,
          imported: results.length,
          summary: `Successfully imported ${results.length} sites, ${errors.length} failures`
        });
      } else {
        res.status(400).json({ 
          message: 'No sites were imported',
          errors: errors
        });
      }
    } catch (error) {
      console.error('Error importing sites:', error);
      res.status(500).json({ 
        message: 'Error importing sites',
        error: error.message,
        details: error.stack
      });
    } finally {
      client.release();
    }
  }
};

module.exports = siteController;