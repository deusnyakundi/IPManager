const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');

const configController = {
  // Get all IP assignments
  getAssignments: async (req, res) => {
    try {
      console.log('Getting assignments...');
      const { search } = req.query;
      
      let query = `
        SELECT * FROM ip_assignments 
        WHERE 1=1
      `;
      
      const params = [];
      if (search) {
        query += ` AND site_name ILIKE $1`;
        params.push(`%${search}%`);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      const result = await pool.query(query, params);
      console.log('Found assignments:', result.rows);
      res.json(result.rows);
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error getting assignments:', error);
      res.status(500).json({ message: 'Error getting assignments' });
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