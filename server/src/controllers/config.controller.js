const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');

const configController = {
  // Get dashboard statistics
  getAssignments: async (req, res) => {
    try {
      console.log('Getting dashboard stats...');
      const query = `
              WITH base_data AS (
              SELECT
                SUBSTRING(ia.site_name, 1, POSITION('-' IN ia.site_name) - 1) AS base_name,
                CASE
                    WHEN ia.site_name LIKE '%OLT%' THEN SUBSTRING(ia.site_name, 1, POSITION('OLT' IN ia.site_name) + 3)
                    ELSE ia.site_name
                END AS base_olt,
                ia.site_name,
                r.name AS region_name,
                m.name AS msp_name
              FROM ip_assignments ia
              LEFT JOIN sites s ON s.name = SUBSTRING(ia.site_name, 1, POSITION('-' IN ia.site_name) - 1)
              LEFT JOIN regions r ON s.region_id = r.id
              LEFT JOIN msps m ON s.msp_id = m.id
              WHERE ia.site_name LIKE '%-OLT%'
            ),
            site_counts AS (
              SELECT
                base_name,
                region_name,
                msp_name,
                COUNT(DISTINCT base_name) AS site_count -- Count distinct base_names
              FROM base_data
              GROUP BY base_name, region_name, msp_name
            ),
            olt_counts AS (
              SELECT
                base_name,
                region_name,
                msp_name,
                COUNT(*) AS olt_count, -- Count all OLTs within the base_name
                string_agg(
                        CASE 
                          WHEN site_name LIKE '%ADRIAN%' THEN 'adrian'
                          WHEN site_name LIKE '%EGYPRO%' THEN 'egypro'
                          WHEN site_name LIKE '%HUAWEI%' THEN 'huawei'
                          WHEN site_name LIKE '%NOKIA%' THEN 'nokia'
                          ELSE 'other'
                        END, ',') as vendor_types
              FROM base_data
              GROUP BY base_name, region_name, msp_name
            )
            SELECT sc.base_name, sc.region_name, sc.msp_name, sc.site_count, oc.olt_count, oc.vendor_types
            FROM site_counts sc
            JOIN olt_counts oc ON sc.base_name = oc.base_name AND sc.region_name = oc.region_name AND sc.msp_name = oc.msp_name
            ORDER BY sc.base_name
      `;
      
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting assignments:', error);
      res.status(500).json({ message: 'Error getting assignments' });
    }
  },

  // Get full IP assignments list for config generator
  getAllAssignments: async (req, res) => {
    try {
      const { search } = req.query;
      
      const query = `
        SELECT 
          ia.*,
          s.region_id,
          r.name as region_name,
          s.msp_id,
          m.name as msp_name
        FROM ip_assignments ia
        LEFT JOIN sites s ON REPLACE(REPLACE(s.name, '-OLT', ''), '-OLT02', '') = 
                           REPLACE(REPLACE(ia.site_name, '-OLT', ''), '-OLT02', '')
        LEFT JOIN regions r ON s.region_id = r.id
        LEFT JOIN msps m ON s.msp_id = m.id
        ${search ? "WHERE ia.site_name ILIKE $1" : ""}
        ORDER BY ia.site_name
      `;
      
      const params = search ? [`%${search}%`] : [];
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting all assignments:', error);
      res.status(500).json({ message: 'Error getting all assignments' });
    }
  },

  // Generate configuration file
  generateConfig: async (req, res) => {
    const { assignmentId, oltModel } = req.body;

    try {
      // Get assignment details
      const assignment = await pool.query(
        'SELECT * FROM ip_assignments WHERE id = $1',
        [assignmentId]
      );

      if (assignment.rows.length === 0) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      // Determine if this is OLT or OLT02 by checking the site name
      const siteName = assignment.rows[0].site_name;
      const mgmtVlan = siteName.endsWith('OLT02') ? '1001' : '1000';

      // Calculate next hop IP (increment last octet by 1)
      const currentIP = assignment.rows[0].assigned_ip;
      const ipParts = currentIP.split('.');
      const nextHopIP = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.${parseInt(ipParts[3]) + 1}`;

      // Read template file
      const templatePath = path.join(__dirname, `../templates/${oltModel}.cfg`);
      let template = await fs.readFile(templatePath, 'utf8');

      // Replace placeholders with actual values
      template = template.replace(/\${SITE_NAME}/g, assignment.rows[0].site_name)
                        .replace(/\${IP_ADDRESS}/g, assignment.rows[0].assigned_ip)
                        .replace(/\${VLAN}/g, assignment.rows[0].management_vlan)
                        .replace(/\${MGNTVLAN}/g, mgmtVlan)
                        .replace(/\${NEXTHOP}/g, nextHopIP)
                        .replace(/\${PRIMARY_VCID}/g, assignment.rows[0].primary_vcid)
                        .replace(/\${SECONDARY_VCID}/g, assignment.rows[0].secondary_vcid);

      // Send file
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=${assignment.rows[0].site_name}_${oltModel}.cfg`);
      res.send(template);
    } catch (error) {
      console.error('Error generating configuration:', error);
      res.status(500).json({ message: 'Error generating configuration' });
    }
  }
};

module.exports = configController; 