const express = require('express');
const { adminAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../config/supabase');

const router = express.Router();

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     tags: [Admin - Analytics]
 *     summary: Get comprehensive analytics
 *     description: Fetch analytics data for a specified timeframe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: week
 *         description: Timeframe for analytics
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    let previousEndDate = new Date();

    switch (timeframe) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousStartDate.setHours(0, 0, 0, 0);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        previousEndDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        previousStartDate.setDate(previousStartDate.getDate() - 14);
        previousEndDate.setDate(previousEndDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        previousStartDate.setDate(previousStartDate.getDate() - 60);
        previousEndDate.setDate(previousEndDate.getDate() - 30);
        break;
      case 'year':
        startDate.setDate(startDate.getDate() - 365);
        previousStartDate.setDate(previousStartDate.getDate() - 730);
        previousEndDate.setDate(previousEndDate.getDate() - 365);
        break;
    }

    // Get current period revenue
    const { data: currentBookings, error: currentError } = await supabaseAdmin
      .from('bookings')
      .select('final_amount, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .in('status', ['completed', 'in_progress']);

    if (currentError) throw currentError;

    const currentRevenue = currentBookings?.reduce((sum, b) => {
      return sum + parseFloat(b.final_amount || 0);
    }, 0) || 0;

    const currentBookingCount = currentBookings?.length || 0;

    // Get previous period revenue for comparison
    const { data: previousBookings, error: previousError} = await supabaseAdmin
      .from('bookings')
      .select('final_amount, status')
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString())
      .in('status', ['completed', 'in_progress']);

    if (previousError) throw previousError;

    const previousRevenue = previousBookings?.reduce((sum, b) => {
      return sum + parseFloat(b.final_amount || 0);
    }, 0) || 0;

    const previousBookingCount = previousBookings?.length || 0;

    // Calculate growth percentages
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const bookingsGrowth = previousBookingCount > 0
      ? ((currentBookingCount - previousBookingCount) / previousBookingCount) * 100
      : 0;

    // Get new customers in current period
    const { count: currentCustomers, error: currentCustomersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (currentCustomersError) throw currentCustomersError;

    // Get new customers in previous period
    const { count: previousCustomers, error: previousCustomersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString());

    if (previousCustomersError) throw previousCustomersError;

    const customersGrowth = previousCustomers > 0
      ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
      : 0;

    // Calculate average order value
    const currentAvgOrderValue = currentBookingCount > 0
      ? currentRevenue / currentBookingCount
      : 0;

    const previousAvgOrderValue = previousBookingCount > 0
      ? previousRevenue / previousBookingCount
      : 0;

    const avgOrderValueGrowth = previousAvgOrderValue > 0
      ? ((currentAvgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100
      : 0;

    res.json({
      revenue: {
        current: Math.round(currentRevenue * 100) / 100,
        previous: Math.round(previousRevenue * 100) / 100,
        growth: Math.round(revenueGrowth * 10) / 10
      },
      bookings: {
        current: currentBookingCount,
        previous: previousBookingCount,
        growth: Math.round(bookingsGrowth * 10) / 10
      },
      customers: {
        current: currentCustomers || 0,
        previous: previousCustomers || 0,
        growth: Math.round(customersGrowth * 10) / 10
      },
      avgOrderValue: {
        current: Math.round(currentAvgOrderValue * 100) / 100,
        previous: Math.round(previousAvgOrderValue * 100) / 100,
        growth: Math.round(avgOrderValueGrowth * 10) / 10
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/analytics/revenue-by-day:
 *   get:
 *     tags: [Admin - Analytics]
 *     summary: Get revenue by day
 *     description: Fetch daily revenue for the past 7 days
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily revenue data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/revenue-by-day', adminAuth, async (req, res) => {
  try {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueByDay = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { data: dayBookings, error } = await supabaseAdmin
        .from('bookings')
        .select('final_amount')
        .gte('scheduled_date', date.toISOString().split('T')[0])
        .lt('scheduled_date', nextDate.toISOString().split('T')[0])
        .in('status', ['completed', 'in_progress']);

      if (error) throw error;

      const dayRevenue = dayBookings?.reduce((sum, b) => {
        return sum + parseFloat(b.final_amount || 0);
      }, 0) || 0;

      revenueByDay.push({
        day: daysOfWeek[date.getDay()],
        date: date.toISOString().split('T')[0],
        revenue: Math.round(dayRevenue * 100) / 100
      });
    }

    res.json(revenueByDay);

  } catch (error) {
    console.error('Error fetching revenue by day:', error);
    res.status(500).json({
      error: 'Failed to fetch revenue by day',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/analytics/top-services:
 *   get:
 *     tags: [Admin - Analytics]
 *     summary: Get top performing services
 *     description: Fetch services ranked by booking count
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 5
 *         description: Number of top services to return
 *     responses:
 *       200:
 *         description: Top services retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/top-services', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Get all services
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('id, name');

    if (servicesError) throw servicesError;

    // Get booking counts and revenue for each service
    const servicesWithStats = await Promise.all(
      services.map(async (service) => {
        const { data: bookings, error: bookingsError } = await supabaseAdmin
          .from('bookings')
          .select('final_amount')
          .eq('service_id', service.id);

        if (bookingsError) throw bookingsError;

        const bookingCount = bookings?.length || 0;
        const revenue = bookings?.reduce((sum, b) => {
          return sum + parseFloat(b.final_amount || 0);
        }, 0) || 0;

        return {
          name: service.name,
          bookings: bookingCount,
          revenue: Math.round(revenue * 100) / 100
        };
      })
    );

    // Sort by booking count and take top N
    const topServices = servicesWithStats
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, limit);

    res.json(topServices);

  } catch (error) {
    console.error('Error fetching top services:', error);
    res.status(500).json({
      error: 'Failed to fetch top services',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/analytics/customer-growth:
 *   get:
 *     tags: [Admin - Analytics]
 *     summary: Get customer growth over time
 *     description: Fetch new customer registrations by month
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: number
 *           default: 6
 *         description: Number of months to show
 *     responses:
 *       200:
 *         description: Customer growth data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/customer-growth', adminAuth, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const growthData = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const { count: newCustomers, error } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (error) throw error;

      growthData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newCustomers: newCustomers || 0
      });
    }

    res.json(growthData);

  } catch (error) {
    console.error('Error fetching customer growth:', error);
    res.status(500).json({
      error: 'Failed to fetch customer growth',
      message: error.message
    });
  }
});

module.exports = router;
