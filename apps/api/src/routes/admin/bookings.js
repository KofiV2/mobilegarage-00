const express = require('express');
const { adminAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../config/supabase');
const { notifyBookingUpdated, notifyBookingCancelled } = require('../../websocket');

const router = express.Router();

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     tags: [Admin - Bookings]
 *     summary: Get all bookings
 *     description: Fetch all bookings with optional filtering and search
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by booking number or customer name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled, no_show]
 *         description: Filter by booking status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by scheduled date (YYYY-MM-DD)
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
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const { search, status, date } = req.query;

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_number,
        scheduled_date,
        scheduled_date,
        status,
        total_price,
        payment_status,
        created_at,
        users!inner(id, first_name, last_name, email),
        services!inner(id, name),
        vehicles!inner(id, make, model, year)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply date filter
    if (date) {
      query = query.eq('scheduled_date', date);
    }

    // Apply search filter (search in booking_number)
    if (search) {
      query = query.ilike('booking_number', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: bookings, error, count } = await query;

    if (error) throw error;

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      data: bookings || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages,
      hasNextPage,
      hasPrevPage
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   get:
 *     tags: [Admin - Bookings]
 *     summary: Get booking by ID
 *     description: Fetch detailed information about a specific booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        users!inner(id, first_name, last_name, email, phone),
        services!inner(id, name, description, base_price),
        vehicles!inner(id, make, model, year, color, license_plate)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Booking not found' });
      }
      throw error;
    }

    res.json(booking);

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}/status:
 *   put:
 *     tags: [Admin - Bookings]
 *     summary: Update booking status
 *     description: Change the status of a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, in_progress, completed, cancelled, no_show]
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    // If status is completed, set completed_at
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    // If status is cancelled, set cancelled_at
    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        users!inner(first_name, last_name, email),
        services!inner(name)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Booking not found' });
      }
      throw error;
    }

    // Emit WebSocket event for real-time update
    if (status === 'cancelled') {
      notifyBookingCancelled(booking);
    } else {
      notifyBookingUpdated(booking);
    }

    res.json({
      message: 'Booking status updated successfully',
      booking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      error: 'Failed to update booking status',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}/assign-staff:
 *   put:
 *     tags: [Admin - Bookings]
 *     summary: Assign staff to booking
 *     description: Assign a staff member to handle a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *             properties:
 *               staffId:
 *                 type: string
 *                 description: Staff user ID
 *     responses:
 *       200:
 *         description: Staff assigned successfully
 *       404:
 *         description: Booking or staff not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id/assign-staff', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    // Verify staff exists and has staff role
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', staffId)
      .single();

    if (staffError || !staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    if (staff.role !== 'staff' && staff.role !== 'admin') {
      return res.status(400).json({ error: 'User is not a staff member' });
    }

    // Assign staff to booking
    const { data: booking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        assigned_to: staffId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        users!inner(first_name, last_name),
        assignedStaff:users!assigned_to(first_name, last_name)
      `)
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Booking not found' });
      }
      throw updateError;
    }

    res.json({
      message: 'Staff assigned successfully',
      booking
    });

  } catch (error) {
    console.error('Error assigning staff:', error);
    res.status(500).json({
      error: 'Failed to assign staff',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/bookings/stats:
 *   get:
 *     tags: [Admin - Bookings]
 *     summary: Get booking statistics
 *     description: Fetch booking statistics by status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    // Get counts by status
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('status');

    if (error) throw error;

    const stats = {
      total: bookings.length,
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0
    };

    bookings.forEach(booking => {
      if (stats.hasOwnProperty(booking.status)) {
        stats[booking.status]++;
      }
    });

    res.json(stats);

  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      error: 'Failed to fetch booking statistics',
      message: error.message
    });
  }
});

module.exports = router;
