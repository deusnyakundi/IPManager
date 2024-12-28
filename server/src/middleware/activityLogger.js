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
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  let responseBody = null;

  // Capture json responses
  res.json = function (body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Capture regular responses
  res.send = function (body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Intercept the response before it's sent
  res.end = async function (chunk) {
    if (chunk) {
      responseBody = chunk;
    }

    // Try to parse response body if it's a string
    let parsedBody = responseBody;
    if (typeof responseBody === 'string') {
      try {
        parsedBody = JSON.parse(responseBody);
      } catch (e) {
        // Not JSON, use as is
      }
    }

    // Don't log GET requests unless they fail
    if (req.method !== 'GET' || res.statusCode >= 400) {
      console.log('Creating activity log for:', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        body: req.body,
        response: parsedBody
      });

      try {
        await createActivityLog({
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
            response: parsedBody,
            statusCode: res.statusCode
          }
        });
      } catch (error) {
        console.error('Failed to create activity log:', error);
      }
    }

    originalEnd.call(this, chunk);
  };

  next();
};

module.exports = activityLogger; 