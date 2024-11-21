// server/src/controllers/vlanblock.controller.js

const { Pool } = require('pg');
const pool = require('../config/db');

// Controller to create a VLAN range
exports.createVLANRange = async (req, res) => {
    const { start_vlan, end_vlan, regionId } = req.body; // Use the correct field names
    console.log('Request Body:', req.body); // Debugging: Log the request body
    try {
      if (!start_vlan || !end_vlan || !regionId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      // Insert VLAN range into the database
      await pool.query(
        'INSERT INTO vlan_ranges (start_vlan, end_vlan, region_id) VALUES ($1, $2, $3)',
        [start_vlan, end_vlan, regionId]
      );
      res.status(201).json({ message: 'VLAN range created successfully' });
    } catch (error) {
      console.error('Error creating VLAN range:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

// Controller to get all VLAN range

exports.getVLANRanges = async (req, res) => {
    try {
      console.log('Executing getVLANRanges query'); // Log before query execution
      const result = await pool.query(`
        SELECT vr.id, vr.start_vlan, vr.end_vlan, vr.region_id, r.name AS region_name
        FROM vlan_ranges vr
        JOIN regions r ON vr.region_id = r.id
      `);
      console.log('VLAN Ranges:', result.rows); // Log the query result
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching VLAN ranges:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

   // server/src/controllers/vlanblock.controller.js

   exports.deleteVLANRange = async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM vlan_ranges WHERE id = $1', [id]);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting VLAN range:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  