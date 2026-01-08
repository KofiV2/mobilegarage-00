const express = require('express');
const { adminAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../config/supabase');
const bcrypt = require('bcrypt');

const router = express.Router();

/**
 * @swagger
 * /api/admin/staff:
 *   get:
 *     tags: [Admin - Staff]
 *     summary: Get all staff members
 *     description: Fetch all staff members with pagination and filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const { search, status } = req.query;

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    // Build query for staff only
    let query = supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone, role, is_active, is_verified, created_at, last_login_at', { count: 'exact' })
      .eq('role', 'staff')
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status) {
      const isActive = status === 'active';
      query = query.eq('is_active', isActive);
    }

    // Apply search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: staff, error, count } = await query;

    if (error) throw error;

    // Get stats for each staff member
    const staffWithStats = await Promise.all(
      (staff || []).map(async (member) => {
        // Get booking counts
        const { count: totalBookings } = await supabaseAdmin
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_staff_id', member.id);

        const { count: completedBookings } = await supabaseAdmin
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_staff_id', member.id)
          .eq('status', 'completed');

        const { count: todayBookings } = await supabaseAdmin
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_staff_id', member.id)
          .gte('scheduled_date', new Date().toISOString().split('T')[0]);

        return {
          ...member,
          stats: {
            totalBookings: totalBookings || 0,
            completedBookings: completedBookings || 0,
            todayBookings: todayBookings || 0
          }
        };
      })
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);

    res.json({
      staff: staffWithStats,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      error: 'Failed to fetch staff',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/staff/{id}:
 *   get:
 *     tags: [Admin - Staff]
 *     summary: Get staff member by ID
 */
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: staff, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'staff')
      .single();

    if (error || !staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Get detailed stats
    const { count: totalBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_staff_id', id);

    const { count: completedBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_staff_id', id)
      .eq('status', 'completed');

    // Get recent bookings
    const { data: recentBookings } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_number,
        scheduled_date,
        scheduled_time,
        status,
        total_price,
        users:user_id (
          first_name,
          last_name
        ),
        services (
          name
        )
      `)
      .eq('assigned_staff_id', id)
      .order('scheduled_date', { ascending: false })
      .limit(10);

    res.json({
      staff: {
        ...staff,
        stats: {
          totalBookings: totalBookings || 0,
          completedBookings: completedBookings || 0
        },
        recentBookings: recentBookings || []
      }
    });

  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({
      error: 'Failed to fetch staff member',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/staff:
 *   post:
 *     tags: [Admin - Staff]
 *     summary: Create new staff member
 */
router.post('/', adminAuth, async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    // Validation
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'password', 'first_name', 'last_name']
      });
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff member
    const { data: newStaff, error } = await supabaseAdmin
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name,
        last_name,
        phone: phone || null,
        role: 'staff',
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Staff member created successfully',
      staff: {
        id: newStaff.id,
        email: newStaff.email,
        first_name: newStaff.first_name,
        last_name: newStaff.last_name,
        role: newStaff.role,
        is_active: newStaff.is_active
      }
    });

  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({
      error: 'Failed to create staff member',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/staff/{id}:
 *   put:
 *     tags: [Admin - Staff]
 *     summary: Update staff member
 */
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, email } = req.body;

    // Build update object
    const updates = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (phone !== undefined) updates.phone = phone;
    if (email) updates.email = email.toLowerCase();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // If email is being updated, check for duplicates
    if (email) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .neq('id', id)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update staff member
    const { data: updatedStaff, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .eq('role', 'staff')
      .select()
      .single();

    if (error || !updatedStaff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({
      message: 'Staff member updated successfully',
      staff: updatedStaff
    });

  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({
      error: 'Failed to update staff member',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/staff/{id}/toggle-status:
 *   put:
 *     tags: [Admin - Staff]
 *     summary: Toggle staff member active status
 */
router.put('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const { data: staff } = await supabaseAdmin
      .from('users')
      .select('is_active')
      .eq('id', id)
      .eq('role', 'staff')
      .single();

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Toggle status
    const { data: updatedStaff, error } = await supabaseAdmin
      .from('users')
      .update({ is_active: !staff.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Staff status updated successfully',
      staff: updatedStaff
    });

  } catch (error) {
    console.error('Error toggling staff status:', error);
    res.status(500).json({
      error: 'Failed to toggle staff status',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/staff/{id}:
 *   delete:
 *     tags: [Admin - Staff]
 *     summary: Delete staff member
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if staff has active bookings
    const { count: activeBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_staff_id', id)
      .in('status', ['pending', 'confirmed', 'in_progress']);

    if (activeBookings > 0) {
      return res.status(400).json({
        error: 'Cannot delete staff member with active bookings',
        activeBookings
      });
    }

    // Delete staff member
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
      .eq('role', 'staff');

    if (error) throw error;

    res.json({ message: 'Staff member deleted successfully' });

  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({
      error: 'Failed to delete staff member',
      message: error.message
    });
  }
});

module.exports = router;
