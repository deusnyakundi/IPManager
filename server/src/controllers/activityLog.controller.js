const pool = require('../config/db');

module.exports = {
  getActivityLogs: async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        userId,
        actionType,
        entityType,
        page = 1,
        limit = 50
      } = req.query;

      let query = `
        SELECT * FROM activity_logs 
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;

      if (startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      if (actionType) {
        query += ` AND action_type = $${paramIndex}`;
        params.push(actionType);
        paramIndex++;
      }

      if (entityType) {
        query += ` AND entity_type = $${paramIndex}`;
        params.push(entityType);
        paramIndex++;
      }

      // Add pagination
      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) FROM activity_logs 
        WHERE 1=1 
        ${query.split('ORDER BY')[0].split('WHERE 1=1')[1] || ''}
      `;
      const countResult = await pool.query(countQuery, params.slice(0, -2));

      res.json({
        logs: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error getting activity logs:', error);
      res.status(500).json({ message: 'Error getting activity logs' });
    }
  }
}; 