const express = require('express');
const { checkPermission } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../config/supabase');
const { PERMISSIONS, PERMISSION_CATEGORIES, ROLE_PERMISSIONS, getAllRoles, getRoleDisplayName, getRolePermissions } = require('../../config/permissions');

const router = express.Router();

/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     tags: [Admin - Roles]
 *     summary: Get all roles and their permissions
 *     description: Fetch all available roles with their assigned permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/', checkPermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const roles = getAllRoles().map(role => ({
      key: role,
      name: getRoleDisplayName(role),
      permissions: getRolePermissions(role),
      isWildcard: ROLE_PERMISSIONS[role] === '*'
    }));

    res.json({
      roles,
      allPermissions: Object.values(PERMISSIONS),
      permissionCategories: PERMISSION_CATEGORIES
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      error: 'Failed to fetch roles',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/roles/{role}:
 *   get:
 *     tags: [Admin - Roles]
 *     summary: Get role details
 *     description: Fetch details of a specific role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *         description: Role key
 *     responses:
 *       200:
 *         description: Role details retrieved successfully
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/:role', checkPermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const { role } = req.params;

    if (!ROLE_PERMISSIONS[role]) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const roleDetails = {
      key: role,
      name: getRoleDisplayName(role),
      permissions: getRolePermissions(role),
      isWildcard: ROLE_PERMISSIONS[role] === '*'
    };

    // Get count of users with this role
    const { count } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', role);

    roleDetails.userCount = count || 0;

    res.json(roleDetails);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      error: 'Failed to fetch role',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/roles/user/{userId}:
 *   put:
 *     tags: [Admin - Roles]
 *     summary: Update user role
 *     description: Assign a new role to a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin, manager, staff, customer]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.put('/user/:userId', checkPermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!ROLE_PERMISSIONS[role]) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Update user role
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, first_name, last_name, role')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }

    res.json({
      message: 'User role updated successfully',
      user: {
        ...user,
        permissions: getRolePermissions(role)
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      error: 'Failed to update user role',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/roles/permissions:
 *   get:
 *     tags: [Admin - Roles]
 *     summary: Get all permissions grouped by category
 *     description: Fetch all available permissions organized by categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/permissions/all', checkPermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    res.json({
      categories: PERMISSION_CATEGORIES,
      allPermissions: Object.values(PERMISSIONS)
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      error: 'Failed to fetch permissions',
      message: error.message
    });
  }
});

module.exports = router;
