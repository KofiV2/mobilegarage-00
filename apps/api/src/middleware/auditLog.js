const { Pool } = require('pg');

// Audit logging middleware
const auditLog = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to log after response
  res.json = function(data) {
    // Log the action after successful response
    if (res.statusCode < 400) {
      logAudit(req, data).catch(err => {
        console.error('Audit log error:', err);
      });
    }

    return originalJson(data);
  };

  next();
};

// Function to log audit entry
const logAudit = async (req, responseData) => {
  try {
    // Skip if no user (public routes)
    if (!req.user) return;

    // Skip read-only operations (GET requests) unless it's a sensitive route
    const sensitiveRoutes = ['/admin/analytics', '/admin/revenue'];
    const isSensitiveRoute = sensitiveRoutes.some(route => req.path.includes(route));

    if (req.method === 'GET' && !isSensitiveRoute) {
      return;
    }

    // Determine action type
    const action = getActionType(req.method);

    // Determine entity type from URL
    const entityType = getEntityType(req.path);

    // Get entity ID from params or body
    const entityId = req.params.id || responseData?.id || null;

    // Prepare audit log entry
    const auditEntry = {
      user_id: req.user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: req.method === 'PUT' || req.method === 'PATCH' ? req.oldValues : null,
      new_values: req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' ? req.body : null,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      path: req.path,
      method: req.method
    };

    // Save to database
    await saveAuditLog(auditEntry);
  } catch (error) {
    console.error('Error in audit logging:', error);
  }
};

// Helper: Get action type from HTTP method
const getActionType = (method) => {
  const actionMap = {
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
    GET: 'read'
  };

  return actionMap[method] || 'unknown';
};

// Helper: Extract entity type from path
const getEntityType = (path) => {
  const match = path.match(/\/api\/([^\/]+)/);
  if (match && match[1]) {
    // Convert plural to singular and clean up
    return match[1].replace(/s$/, '');
  }
  return 'unknown';
};

// Helper: Save audit log to database
const saveAuditLog = async (entry) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const query = `
    INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      ip_address,
      user_agent,
      path,
      method,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
  `;

  const values = [
    entry.user_id,
    entry.action,
    entry.entity_type,
    entry.entity_id,
    entry.old_values ? JSON.stringify(entry.old_values) : null,
    entry.new_values ? JSON.stringify(entry.new_values) : null,
    entry.ip_address,
    entry.user_agent,
    entry.path,
    entry.method
  ];

  try {
    await pool.query(query);
  } catch (error) {
    console.error('Database audit log error:', error);
  } finally {
    await pool.end();
  }
};

// Middleware to capture old values before update
const captureOldValues = (model) => {
  return async (req, res, next) => {
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.params.id) {
      try {
        const record = await model.findByPk(req.params.id);
        if (record) {
          req.oldValues = record.toJSON();
        }
      } catch (error) {
        console.error('Error capturing old values:', error);
      }
    }
    next();
  };
};

module.exports = {
  auditLog,
  captureOldValues,
  logAudit,
  saveAuditLog
};
