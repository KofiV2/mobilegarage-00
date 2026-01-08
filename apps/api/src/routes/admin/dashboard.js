const express = require('express');
const { adminAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../config/supabase');

const router = express.Router();

/**
 * @swagger
 * /api/admin/dashboard-stats:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: Get dashboard statistics
 *     description: Fetch real-time statistics for admin dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: number
 *                   description: Total number of users
 *                 totalBookings:
 *                   type: number
 *                   description: Total number of bookings
 *                 totalRevenue:
 *                   type: number
 *                   description: Total revenue in AED
 *                 activeBookings:
 *                   type: number
 *                   description: Number of active bookings (confirmed or in-progress)
 *                 completedToday:
 *                   type: number
 *                   description: Number of bookings completed today
 *                 pendingBookings:
 *                   type: number
 *                   description: Number of pending bookings
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/dashboard-stats', adminAuth, async (req, res) => {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get total bookings count
    const { count: totalBookings, error: bookingsCountError } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    if (bookingsCountError) throw bookingsCountError;

    // Get total revenue (sum of all completed bookings)
    const { data: completedBookings, error: revenueError } = await supabaseAdmin
      .from('bookings')
      .select('final_amount')
      .in('status', ['completed', 'in_progress']);

    if (revenueError) throw revenueError;

    const totalRevenue = completedBookings?.reduce((sum, booking) => {
      return sum + (parseFloat(booking.final_amount) || 0);
    }, 0) || 0;

    // Get active bookings count (confirmed or in_progress)
    const { count: activeBookings, error: activeError } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'in_progress']);

    if (activeError) throw activeError;

    // Get today's completed bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count: completedToday, error: completedTodayError } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', today.toISOString())
      .lt('updated_at', tomorrow.toISOString());

    if (completedTodayError) throw completedTodayError;

    // Get pending bookings count
    const { count: pendingBookings, error: pendingError } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    res.json({
      totalUsers: totalUsers || 0,
      totalBookings: totalBookings || 0,
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
      activeBookings: activeBookings || 0,
      completedToday: completedToday || 0,
      pendingBookings: pendingBookings || 0
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/recent-activity:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: Get recent activity
 *     description: Fetch recent bookings and user registrations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of recent items to fetch
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/recent-activity', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent bookings
    const { data: recentBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_number, status, final_amount, created_at, users(first_name, last_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (bookingsError) throw bookingsError;

    // Get recent user registrations
    const { data: recentUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (usersError) throw usersError;

    res.json({
      recentBookings: recentBookings || [],
      recentUsers: recentUsers || []
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/dashboard-charts:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: Get chart data for dashboard visualizations
 *     description: Fetch data for revenue trend, bookings status, user growth, and top services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *         description: Number of days for revenue and user growth charts
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/dashboard-charts', adminAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    let startDate, endDate;

    // Check if custom date range is provided
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Use days parameter
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      endDate = today;

      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
    }

    // Calculate actual number of days for iteration
    const actualDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // 1. Revenue Data (Last N days)
    const revenueData = [];
    for (let i = 0; i < actualDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { data: dayBookings, error: revenueError } = await supabaseAdmin
        .from('bookings')
        .select('final_amount')
        .in('status', ['completed', 'in_progress'])
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());

      if (revenueError) throw revenueError;

      const revenue = dayBookings?.reduce((sum, booking) => {
        return sum + (parseFloat(booking.final_amount) || 0);
      }, 0) || 0;

      revenueData.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(revenue * 100) / 100,
        day: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }

    // 2. Bookings Status Distribution
    const statusList = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    const bookingsStatusData = [];

    for (const status of statusList) {
      const { count, error: statusError } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (statusError) throw statusError;

      bookingsStatusData.push({
        status,
        count: count || 0,
        name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
      });
    }

    // 3. User Growth (Last N days)
    const userGrowthData = [];
    for (let i = 0; i < actualDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { count, error: userError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());

      if (userError) throw userError;

      userGrowthData.push({
        date: date.toISOString().split('T')[0],
        users: count || 0,
        day: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }

    // 4. Top Services
    const { data: allBookings, error: servicesError } = await supabaseAdmin
      .from('bookings')
      .select('service_id, services(id, name)')
      .not('service_id', 'is', null);

    if (servicesError) throw servicesError;

    // Count bookings per service
    const serviceCounts = {};
    allBookings?.forEach(booking => {
      if (booking.services) {
        const serviceName = booking.services.name;
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
      }
    });

    // Convert to array and sort
    const topServicesData = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 services

    res.json({
      revenueData,
      bookingsStatusData,
      userGrowthData,
      topServicesData
    });

  } catch (error) {
    console.error('Error fetching dashboard charts:', error);
    res.status(500).json({
      error: 'Failed to fetch chart data',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/today-highlights:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: Get today's highlights with comparisons
 *     description: Fetch today's metrics compared to yesterday
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's highlights retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/today-highlights', adminAuth, async (req, res) => {
  try {
    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Yesterday's date range
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Today's Revenue
    const { data: todayBookings, error: todayRevenueError } = await supabaseAdmin
      .from('bookings')
      .select('final_amount')
      .in('status', ['completed', 'in_progress'])
      .gte('created_at', today.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (todayRevenueError) throw todayRevenueError;

    const todayRevenue = todayBookings?.reduce((sum, booking) => {
      return sum + (parseFloat(booking.final_amount) || 0);
    }, 0) || 0;

    // Yesterday's Revenue
    const { data: yesterdayBookings, error: yesterdayRevenueError } = await supabaseAdmin
      .from('bookings')
      .select('final_amount')
      .in('status', ['completed', 'in_progress'])
      .gte('created_at', yesterday.toISOString())
      .lte('created_at', yesterdayEnd.toISOString());

    if (yesterdayRevenueError) throw yesterdayRevenueError;

    const yesterdayRevenue = yesterdayBookings?.reduce((sum, booking) => {
      return sum + (parseFloat(booking.final_amount) || 0);
    }, 0) || 0;

    // Today's Bookings Count
    const { count: todayBookingsCount, error: todayBookingsError } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (todayBookingsError) throw todayBookingsError;

    // Yesterday's Bookings Count
    const { count: yesterdayBookingsCount, error: yesterdayBookingsError } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
      .lte('created_at', yesterdayEnd.toISOString());

    if (yesterdayBookingsError) throw yesterdayBookingsError;

    // Staff on Duty (active staff)
    const { count: staffOnDuty, error: staffOnDutyError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'staff')
      .eq('is_active', true);

    if (staffOnDutyError) throw staffOnDutyError;

    // Total Staff
    const { count: totalStaff, error: totalStaffError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'staff');

    if (totalStaffError) throw totalStaffError;

    // Completion Rate (today's completed vs total today)
    const { count: todayCompleted, error: completedError } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', today.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (completedError) throw completedError;

    const completionRate = todayBookingsCount > 0
      ? Math.round((todayCompleted / todayBookingsCount) * 100)
      : 0;

    res.json({
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      yesterdayRevenue: Math.round(yesterdayRevenue * 100) / 100,
      todayBookings: todayBookingsCount || 0,
      yesterdayBookings: yesterdayBookingsCount || 0,
      staffOnDuty: staffOnDuty || 0,
      totalStaff: totalStaff || 0,
      completionRate: completionRate
    });

  } catch (error) {
    console.error('Error fetching today highlights:', error);
    res.status(500).json({
      error: 'Failed to fetch today highlights',
      message: error.message
    });
  }
});

module.exports = router;
