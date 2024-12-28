const pool = require('../config/db');

const getActionType = (method) => {
  switch (method) {
    case 'POST': return 'CREATE';
    case 'PUT': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    case 'GET': return 'VIEW';
    default: return 'OTHER';
  }
};

const getEntityType = (path) => {
  const parts = path.split('/');
  return parts[2] || 'unknown'; // Assuming path format: /api/entity-type/...
};

const getEntityId = (path) => {
  const parts = path.split('/');
  const potentialId = parts[3];
  return !isNaN(potentialId) ? parseInt(potentialId) : null;
};

const createActivityLog = async (logData) => {
  const query = `
    INSERT INTO activity_logs (
      user_id, action_type, entity_type, entity_id, 
      old_values, new_values, ip_address, user_agent,
      status, additional_details
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [
      logData.user_id,
      logData.action_type,
      logData.entity_type,
      logData.entity_id,
      logData.old_values,
      logData.new_values,
      logData.ip_address,
      logData.user_agent,
      logData.status,
      logData.additional_details
    ]);
    console.log('Activity log created:', result.rows[0]);
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
};

const activityLogger = (req, res, next) => {
  // Add a flag to track if we've logged this request
  let hasLogged = false;
  
  const originalJson = res.json;
  const originalSend = res.send;

  // Only override json as that's what our API uses
  res.json = function (body) {
    if (!hasLogged && (req.method !== 'GET' || res.statusCode >= 400)) {
      try {
        createActivityLog({
          user_id: req.user?.id,
          action_type: getActionType(req.method),
          entity_type: getEntityType(req.path),
          entity_id: getEntityId(req.path),
          old_values: req.method === 'PUT' ? req.oldValues : null,
          new_values: ['POST', 'PUT'].includes(req.method) ? req.body : null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'],
          status: res.statusCode < 400 ? 'SUCCESS' : 'FAILED',
          additional_details: {
            route: req.path,
            query_params: req.query,
            response: body,
            statusCode: res.statusCode
          }
        });
        hasLogged = true;
      } catch (error) {
        console.error('Failed to create activity log:', error);
      }
    }
    return originalJson.call(this, body);
  };

  // Keep send as fallback but don't log from it
  res.send = function (body) {
    return originalSend.call(this, body);
  };

  next();
};

module.exports = activityLogger; 