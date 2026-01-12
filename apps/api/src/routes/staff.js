const express = require('express');
const { staffAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

/**
 * @swagger
 * /api/staff/assigned-bookings:
 *   get:
 *     tags: [Staff]
 *     summary: Get bookings assigned to current staff member
 *     description: Returns all bookings assigned to the authenticated staff member with filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled]
 *         description: Filter by booking status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date (YYYY-MM-DD)
 *       - in: query
 *         name: today
 *         schema:
 *           type: boolean
 *         description: Filter for today's bookings only
 *     responses:
 *       200:
 *         description: List of assigned bookings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 */
router.get('/assigned-bookings', staffAuth, async (req, res) => {
  try {
    const { status, date, today } = req.query;
    const staffId = req.userId;

    // Build query for bookings assigned to this staff member
    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_number,
        scheduled_date,
        scheduled_time,
        status,
        total_price,
        final_amount,
        notes,
        location,
        created_at,
        completed_at,
        users:user_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        vehicles:vehicle_id (
          id,
          make,
          model,
          year,
          color,
          license_plate
        ),
        services:service_id (
          id,
          name,
          description,
          duration,
          price
        )
      `)
      .eq('assigned_staff_id', staffId)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply date filters
    if (today === 'true' || today === true) {
      const todayDate = new Date().toISOString().split('T')[0];
      query = query.gte('scheduled_date', todayDate)
        .lt('scheduled_date', new Date(new Date(todayDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    } else if (date) {
      query = query.gte('scheduled_date', date)
        .lt('scheduled_date', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching assigned bookings:', error);
      throw error;
    }

    // Transform data for better frontend consumption
    const transformedBookings = (bookings || []).map(booking => ({
      id: booking.id,
      bookingNumber: booking.booking_number,
      scheduledDate: booking.scheduled_date,
      scheduledTime: booking.scheduled_time,
      status: booking.status,
      totalPrice: booking.total_price,
      finalAmount: booking.final_amount,
      notes: booking.notes,
      location: booking.location,
      createdAt: booking.created_at,
      completedAt: booking.completed_at,
      customer: booking.users ? {
        id: booking.users.id,
        firstName: booking.users.first_name,
        lastName: booking.users.last_name,
        fullName: `${booking.users.first_name} ${booking.users.last_name}`,
        email: booking.users.email,
        phone: booking.users.phone
      } : null,
      vehicle: booking.vehicles ? {
        id: booking.vehicles.id,
        make: booking.vehicles.make,
        model: booking.vehicles.model,
        year: booking.vehicles.year,
        color: booking.vehicles.color,
        licensePlate: booking.vehicles.license_plate,
        displayName: `${booking.vehicles.year} ${booking.vehicles.make} ${booking.vehicles.model}`
      } : null,
      service: booking.services ? {
        id: booking.services.id,
        name: booking.services.name,
        description: booking.services.description,
        duration: booking.services.duration,
        price: booking.services.price
      } : null
    }));

    res.json({
      bookings: transformedBookings,
      total: transformedBookings.length
    });

  } catch (error) {
    console.error('Error fetching assigned bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch assigned bookings',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/staff/bookings/{id}/status:
 *   put:
 *     tags: [Staff]
 *     summary: Update booking status
 *     description: Update the status of a booking assigned to the current staff member
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
 *                 enum: [confirmed, in_progress, completed, cancelled]
 *                 description: New status for the booking
 *               notes:
 *                 type: string
 *                 description: Optional notes about the status change
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       400:
 *         description: Invalid status or transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this booking
 *       404:
 *         description: Booking not found
 */
router.put('/bookings/:id/status', staffAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const staffId = req.userId;

    // Validate status
    const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check if booking exists and is assigned to this staff member
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_number, status, assigned_staff_id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    // Verify the booking is assigned to this staff member
    if (booking.assigned_staff_id !== staffId) {
      return res.status(403).json({
        error: 'Not authorized to update this booking',
        message: 'This booking is not assigned to you'
      });
    }

    // Validate status transitions
    const currentStatus = booking.status;
    const invalidTransitions = {
      'completed': ['pending', 'confirmed', 'in_progress'],
      'cancelled': ['pending', 'confirmed', 'in_progress', 'completed']
    };

    if (invalidTransitions[currentStatus] && invalidTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        message: `Cannot change from ${currentStatus} to ${status}`
      });
    }

    // Prepare update data
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add completion timestamp if status is completed
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Add notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        booking_number,
        scheduled_date,
        scheduled_time,
        status,
        total_price,
        final_amount,
        notes,
        completed_at,
        users:user_id (
          first_name,
          last_name,
          email
        ),
        services:service_id (
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating booking status:', updateError);
      throw updateError;
    }

    // Log the status change
    console.log(`Booking ${booking.booking_number} status changed from ${currentStatus} to ${status} by staff ${staffId}`);

    res.json({
      message: 'Booking status updated successfully',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.booking_number,
        status: updatedBooking.status,
        previousStatus: currentStatus,
        completedAt: updatedBooking.completed_at,
        customer: updatedBooking.users ? {
          firstName: updatedBooking.users.first_name,
          lastName: updatedBooking.users.last_name,
          email: updatedBooking.users.email
        } : null,
        service: updatedBooking.services ? {
          name: updatedBooking.services.name
        } : null
      }
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
 * /api/staff/my-stats:
 *   get:
 *     tags: [Staff]
 *     summary: Get staff performance statistics
 *     description: Returns performance metrics for the authenticated staff member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: today
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Staff performance statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 */
router.get('/my-stats', staffAuth, async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const staffId = req.userId;

    // Calculate date range based on period
    let startDate;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        startDate = todayStart.toISOString();
        break;
      case 'week':
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        startDate = weekStart.toISOString();
        break;
      case 'month':
        const monthStart = new Date(todayStart);
        monthStart.setMonth(monthStart.getMonth() - 1);
        startDate = monthStart.toISOString();
        break;
      case 'all':
        startDate = null;
        break;
      default:
        startDate = todayStart.toISOString();
    }

    // Base query for all bookings assigned to this staff member
    let baseQuery = supabaseAdmin
      .from('bookings')
      .select('id, status, scheduled_date, total_price, final_amount, completed_at, created_at')
      .eq('assigned_staff_id', staffId);

    if (startDate) {
      baseQuery = baseQuery.gte('created_at', startDate);
    }

    const { data: allBookings, error } = await baseQuery;

    if (error) {
      console.error('Error fetching staff stats:', error);
      throw error;
    }

    // Calculate statistics
    const stats = {
      totalBookings: allBookings.length,
      pendingBookings: 0,
      confirmedBookings: 0,
      inProgressBookings: 0,
      completedBookings: 0,
      completedToday: 0,
      cancelledBookings: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      avgServiceTime: 0,
      todayBookings: 0
    };

    // Today's date string for comparison
    const todayDateStr = todayStart.toISOString().split('T')[0];
    let totalServiceTime = 0;
    let serviceTimeCount = 0;

    allBookings.forEach(booking => {
      // Count by status
      switch (booking.status) {
        case 'pending':
          stats.pendingBookings++;
          break;
        case 'confirmed':
          stats.confirmedBookings++;
          break;
        case 'in_progress':
          stats.inProgressBookings++;
          break;
        case 'completed':
          stats.completedBookings++;
          // Add to revenue
          if (booking.final_amount) {
            stats.totalRevenue += parseFloat(booking.final_amount);
          }
          break;
        case 'cancelled':
          stats.cancelledBookings++;
          break;
      }

      // Check if booking is for today
      const bookingDate = booking.scheduled_date ? new Date(booking.scheduled_date).toISOString().split('T')[0] : null;
      if (bookingDate === todayDateStr) {
        stats.todayBookings++;

        if (booking.status === 'completed') {
          stats.completedToday++;
          if (booking.final_amount) {
            stats.todayRevenue += parseFloat(booking.final_amount);
          }
        }
      }

      // Calculate service time for completed bookings
      if (booking.status === 'completed' && booking.completed_at && booking.created_at) {
        const startTime = new Date(booking.created_at);
        const endTime = new Date(booking.completed_at);
        const serviceMinutes = (endTime - startTime) / (1000 * 60);

        if (serviceMinutes > 0 && serviceMinutes < 1440) { // Less than 24 hours (valid service time)
          totalServiceTime += serviceMinutes;
          serviceTimeCount++;
        }
      }
    });

    // Calculate average service time
    if (serviceTimeCount > 0) {
      stats.avgServiceTime = Math.round(totalServiceTime / serviceTimeCount);
    }

    // Round revenue to 2 decimal places
    stats.totalRevenue = Math.round(stats.totalRevenue * 100) / 100;
    stats.todayRevenue = Math.round(stats.todayRevenue * 100) / 100;

    // Get upcoming bookings (next 5)
    const { data: upcomingBookings } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_number,
        scheduled_date,
        scheduled_time,
        status,
        users:user_id (
          first_name,
          last_name
        ),
        services:service_id (
          name,
          duration
        )
      `)
      .eq('assigned_staff_id', staffId)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .gte('scheduled_date', todayStart.toISOString())
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(5);

    // Transform upcoming bookings
    const upcoming = (upcomingBookings || []).map(booking => ({
      id: booking.id,
      bookingNumber: booking.booking_number,
      scheduledDate: booking.scheduled_date,
      scheduledTime: booking.scheduled_time,
      status: booking.status,
      customerName: booking.users ? `${booking.users.first_name} ${booking.users.last_name}` : 'Unknown',
      serviceName: booking.services?.name || 'Unknown Service',
      duration: booking.services?.duration || 30
    }));

    res.json({
      stats,
      upcomingBookings: upcoming,
      period
    });

  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({
      error: 'Failed to fetch staff statistics',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/staff/profile:
 *   get:
 *     tags: [Staff]
 *     summary: Get current staff member's profile
 *     description: Returns the authenticated staff member's profile information
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', staffAuth, async (req, res) => {
  try {
    const staffId = req.userId;

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone, role, is_active, created_at, last_login_at')
      .eq('id', staffId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    res.json({
      profile: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        fullName: `${profile.first_name} ${profile.last_name}`,
        phone: profile.phone,
        role: profile.role,
        isActive: profile.is_active,
        createdAt: profile.created_at,
        lastLoginAt: profile.last_login_at
      }
    });

  } catch (error) {
    console.error('Error fetching staff profile:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

module.exports = router;
