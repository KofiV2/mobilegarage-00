const { pool } = require('../config/database');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Enhanced Audit Logging Middleware
 * Captures all admin actions with old/new values, user info, and metadata
 */
const auditLog = async (req, res, next) => {
  // Capture old values for UPDATE/DELETE operations before the route handler executes
  if ((req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') && req.params.id) {
    try {
      const entityType = extractEntityType(req.path);
      const entityId = req.params.id;
      const tableName = getTableName(entityType);

      if (tableName) {
        // Fetch old values from database
        const { data: oldRecord } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .eq('id', entityId)
          .single();

        if (oldRecord) {
          req.oldValues = oldRecord;
        }
      }
    } catch (error) {
      console.error('Error capturing old values:', error);
    }
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to log after response
  res.json = function(data) {
    // Log the action after successful response
    if (res.statusCode < 400) {
      logAudit(req, res, data).catch(err => {
        console.error('Audit log error:', err);
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Function to log audit entry
 */
const logAudit = async (req, res, responseData) => {
  try {
    // Skip if no user (public routes)
    if (!req.user) return;

    // Skip read-only operations (GET requests) unless it's a sensitive route
    const sensitiveRoutes = ['/admin/analytics', '/admin/revenue', '/admin/audit-logs'];
    const isSensitiveRoute = sensitiveRoutes.some(route => req.path.includes(route));

    if (req.method === 'GET' && !isSensitiveRoute) {
      return;
    }

    // Determine action type
    const action = getActionType(req.method);

    // Determine entity type from URL
    const entityType = extractEntityType(req.path);

    // Get entity ID from params or response data
    let entityId = req.params.id || null;

    // For CREATE operations, get ID from response
    if (req.method === 'POST' && responseData) {
      entityId = responseData.id || responseData.user?.id || responseData.booking?.id || responseData.service?.id || null;
    }

    // Prepare new values (remove sensitive data)
    let newValues = null;
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      newValues = sanitizeData({ ...req.body });
    }

    // Prepare old values (remove sensitive data)
    let oldValues = null;
    if (req.oldValues) {
      oldValues = sanitizeData({ ...req.oldValues });
    }

    // Prepare audit log entry
    const auditEntry = {
      user_id: req.user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || null,
      path: req.path,
      method: req.method
    };

    // Save to database
    await saveAuditLog(auditEntry);
  } catch (error) {
    console.error('Error in audit logging:', error);
  }
};

/**
 * Helper: Get action type from HTTP method
 */
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

/**
 * Helper: Extract entity type from path
 * Handles routes like /api/admin/users, /api/bookings, etc.
 */
const extractEntityType = (path) => {
  // Match patterns like /api/admin/users, /api/bookings
  const patterns = [
    /\/api\/admin\/([^\/]+)/,  // Admin routes
    /\/api\/([^\/]+)/           // Other routes
  ];

  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match && match[1]) {
      // Remove trailing 's' to get singular form
      let entity = match[1];

      // Special cases
      if (entity === 'services') return 'service';
      if (entity === 'bookings') return 'booking';
      if (entity === 'users') return 'user';
      if (entity === 'staff') return 'staff';
      if (entity === 'analytics') return 'analytics';
      if (entity === 'audit-logs') return 'audit_log';

      // Default: remove trailing 's'
      return entity.endsWith('s') ? entity.slice(0, -1) : entity;
    }
  }

  return 'unknown';
};

/**
 * Helper: Get table name from entity type
 */
const getTableName = (entityType) => {
  const tableMap = {
    'user': 'users',
    'booking': 'bookings',
    'service': 'services',
    'staff': 'users', // Staff are in users table with role='staff'
    'vehicle': 'vehicles',
    'wallet': 'wallets',
    'loyalty': 'loyalty_points'
  };

  return tableMap[entityType] || null;
};

/**
 * Helper: Sanitize data by removing sensitive fields
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = ['password', 'password_hash', 'token', 'api_key', 'secret'];
  const sanitized = { ...data };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Helper: Get client IP address
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

/**
 * Helper: Save audit log to database
 */
const saveAuditLog = async (entry) => {
  const client = await pool.connect();

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
    RETURNING id
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
    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database audit log error:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Manual audit log function for custom logging
 */
const createAuditLog = async ({ userId, action, entityType, entityId, oldValues, newValues, metadata }) => {
  try {
    const auditEntry = {
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      old_values: sanitizeData(oldValues),
      new_values: sanitizeData(newValues),
      ip_address: metadata?.ip || 'system',
      user_agent: metadata?.userAgent || 'system',
      path: metadata?.path || '/system',
      method: metadata?.method || 'SYSTEM'
    };

    return await saveAuditLog(auditEntry);
  } catch (error) {
    console.error('Error creating manual audit log:', error);
    throw error;
  }
};

module.exports = {
  auditLog,
  logAudit,
  saveAuditLog,
  createAuditLog,
  extractEntityType,
  getTableName,
  sanitizeData
};
