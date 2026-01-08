const express = require('express');
const { adminAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../config/supabase');
const bcrypt = require('bcrypt');

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Get all users
 *     description: Fetch all users with optional filtering and search
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [customer, staff, admin]
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by active status
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
 *         description: Number of records per page (max 100)
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const { search, role, status } = req.query;

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    // Build base query
    let query = supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone, role, is_active, is_verified, created_at, last_login_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply role filter
    if (role) {
      query = query.eq('role', role);
    }

    // Apply status filter
    if (status) {
      const isActive = status === 'active';
      query = query.eq('is_active', isActive);
    }

    // Apply search filter (using Supabase text search)
    if (search) {
      // Search in first_name, last_name, or email
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: users, error, count } = await query;

    if (error) throw error;

    // Get booking counts for all users
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get user's booking count
        const { count: bookingCount } = await supabaseAdmin
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return {
          ...user,
          stats: {
            totalBookings: bookingCount || 0
          }
        };
      })
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      users: usersWithStats,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Get user by ID
 *     description: Fetch detailed information about a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone, role, is_active, is_verified, created_at, updated_at, last_login_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }

    // Get user's booking count
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    // Get user's total spent
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('total_price')
      .eq('user_id', id)
      .eq('status', 'completed');

    const totalSpent = bookings?.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0) || 0;

    res.json({
      ...user,
      stats: {
        totalBookings: bookingCount || 0,
        totalSpent: Math.round(totalSpent * 100) / 100
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     tags: [Admin - Users]
 *     summary: Update user
 *     description: Update user information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, staff, admin]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role } = req.body;

    const updates = {};
    if (firstName) updates.first_name = firstName;
    if (lastName) updates.last_name = lastName;
    if (phone) updates.phone = phone;
    if (role) updates.role = role;

    updates.updated_at = new Date().toISOString();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, first_name, last_name, phone, role, is_active, is_verified')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }

    res.json({
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     tags: [Admin - Users]
 *     summary: Delete user
 *     description: Permanently delete a user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/toggle-status:
 *   put:
 *     tags: [Admin - Users]
 *     summary: Toggle user active status
 *     description: Activate or deactivate a user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User status toggled successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw fetchError;
    }

    // Toggle status
    const newStatus = !currentUser.is_active;

    const { data: user, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, email, first_name, last_name, role, is_active')
      .single();

    if (updateError) throw updateError;

    res.json({
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      user
    });

  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      error: 'Failed to toggle user status',
      message: error.message
    });
  }
});

module.exports = router;
