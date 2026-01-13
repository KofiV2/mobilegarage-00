const express = require('express');
const { adminAuth } = require('../../middleware/auth');
const { pool } = require('../../config/database');

const router = express.Router();

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin - Audit Logs]
 *     summary: Get all audit logs
 *     description: Fetch audit logs with optional filtering, search, and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, update, delete, read]
 *         description: Filter by action type
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *         description: Filter by entity type (user, booking, service, etc.)
 *       - in: query
 *         name: entity_id
 *         schema:
 *           type: integer
 *         description: Filter by specific entity ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs from this date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs until this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in path or user agent
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records per page (max 200)
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const {
      user_id,
      action,
      entity_type,
      entity_id,
      start_date,
      end_date,
      search
    } = req.query;

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (user_id) {
      conditions.push(`al.user_id = $${paramIndex++}`);
      values.push(user_id);
    }

    if (action) {
      conditions.push(`al.action = $${paramIndex++}`);
      values.push(action);
    }

    if (entity_type) {
      conditions.push(`al.entity_type = $${paramIndex++}`);
      values.push(entity_type);
    }

    if (entity_id) {
      conditions.push(`al.entity_id = $${paramIndex++}`);
      values.push(entity_id);
    }

    if (start_date) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      values.push(start_date);
    }

    if (end_date) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      values.push(end_date);
    }

    if (search) {
      conditions.push(`(al.path ILIKE $${paramIndex} OR al.user_agent ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `;

    // Build main query with user details
    const query = `
      SELECT
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.path,
        al.method,
        al.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    // Execute count query
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Execute main query
    const result = await pool.query(query, [...values, limit, offset]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format response
    const logs = result.rows.map(row => ({
      id: row.id,
      user: row.user_id ? {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        role: row.role,
        fullName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown User'
      } : null,
      action: row.action,
      entity: {
        type: row.entity_type,
        id: row.entity_id
      },
      changes: {
        old: row.old_values,
        new: row.new_values
      },
      metadata: {
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        path: row.path,
        method: row.method
      },
      createdAt: row.created_at
    }));

    res.json({
      data: logs,
      total,
      page,
      pageSize: limit,
      totalPages,
      hasNextPage,
      hasPrevPage
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/audit-logs/{id}:
 *   get:
 *     tags: [Admin - Audit Logs]
 *     summary: Get single audit log entry
 *     description: Fetch detailed information about a specific audit log entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log entry retrieved successfully
 *       404:
 *         description: Audit log entry not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.path,
        al.method,
        al.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit log entry not found' });
    }

    const row = result.rows[0];
    const log = {
      id: row.id,
      user: row.user_id ? {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        role: row.role,
        fullName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown User'
      } : null,
      action: row.action,
      entity: {
        type: row.entity_type,
        id: row.entity_id
      },
      changes: {
        old: row.old_values,
        new: row.new_values
      },
      metadata: {
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        path: row.path,
        method: row.method
      },
      createdAt: row.created_at
    };

    res.json(log);

  } catch (error) {
    console.error('Error fetching audit log entry:', error);
    res.status(500).json({
      error: 'Failed to fetch audit log entry',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/audit-logs/stats:
 *   get:
 *     tags: [Admin - Audit Logs]
 *     summary: Get audit log statistics
 *     description: Get statistics about audit logs (actions by type, users, etc.)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for statistics
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (start_date) {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(start_date);
    }

    if (end_date) {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get action statistics
    const actionStatsQuery = `
      SELECT action, COUNT(*) as count
      FROM audit_logs
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
    `;

    // Get entity type statistics
    const entityStatsQuery = `
      SELECT entity_type, COUNT(*) as count
      FROM audit_logs
      ${whereClause}
      GROUP BY entity_type
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get top users
    const userStatsQuery = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(al.id) as action_count
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      ${whereClause}
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY action_count DESC
      LIMIT 10
    `;

    // Get total count
    const totalCountQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs
      ${whereClause}
    `;

    const [actionStats, entityStats, userStats, totalCount] = await Promise.all([
      pool.query(actionStatsQuery, values),
      pool.query(entityStatsQuery, values),
      pool.query(userStatsQuery, values),
      pool.query(totalCountQuery, values)
    ]);

    res.json({
      total: parseInt(totalCount.rows[0].total),
      byAction: actionStats.rows.map(row => ({
        action: row.action,
        count: parseInt(row.count)
      })),
      byEntityType: entityStats.rows.map(row => ({
        entityType: row.entity_type,
        count: parseInt(row.count)
      })),
      topUsers: userStats.rows.map(row => ({
        id: row.id,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        email: row.email,
        actionCount: parseInt(row.action_count)
      }))
    });

  } catch (error) {
    console.error('Error fetching audit log statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

module.exports = router;
