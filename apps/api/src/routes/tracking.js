const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

/**
 * NOTE: This file was migrated from PostgreSQL pool to Supabase.
 * Many endpoints in this file may need refactoring to work with Supabase.
 * pool.connect() and raw SQL queries need to be converted to Supabase queries.
 *
 * @swagger
 * tags:
 *   name: Tracking
 *   description: Staff and fleet vehicle tracking endpoints
 */

// =============================================================================
// STAFF CAR WASH TRACKING ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/tracking/staff/{employeeId}/start-wash:
 *   post:
 *     summary: Start tracking a car wash for a staff member
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *             properties:
 *               booking_id:
 *                 type: string
 *               service_id:
 *                 type: string
 *               vehicle_id:
 *                 type: string
 *               location:
 *                 type: object
 *               notes:
 *                 type: string
 */
router.post('/staff/:employeeId/start-wash', async (req, res) => {
  const client = await pool.connect();

  try {
    const { employeeId } = req.params;
    const { booking_id, service_id, vehicle_id, location, notes } = req.body;

    // Validate employee exists
    const employeeCheck = await client.query(
      'SELECT id FROM employees WHERE id = $1 AND is_active = true',
      [employeeId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found or inactive' });
    }

    // Start the car wash tracking
    const result = await client.query(`
      INSERT INTO staff_car_washes (
        employee_id, booking_id, service_id, vehicle_id,
        start_time, status, location, notes
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'in_progress', $5, $6)
      RETURNING *
    `, [employeeId, booking_id, service_id, vehicle_id, location, notes]);

    // Update booking status
    await client.query(
      'UPDATE bookings SET status = $1, assigned_staff_id = $2 WHERE id = $3',
      ['in_progress', employeeId, booking_id]
    );

    res.status(201).json({
      message: 'Car wash started successfully',
      wash: result.rows[0]
    });
  } catch (error) {
    console.error('Error starting car wash:', error);
    res.status(500).json({ error: 'Failed to start car wash tracking' });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/tracking/staff/wash/{washId}/complete:
 *   put:
 *     summary: Complete a car wash and record metrics
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: washId
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/staff/wash/:washId/complete', async (req, res) => {
  const client = await pool.connect();

  try {
    const { washId } = req.params;
    const { quality_rating, speed_rating, notes, before_photos, after_photos } = req.body;

    const result = await client.query(`
      UPDATE staff_car_washes
      SET
        end_time = CURRENT_TIMESTAMP,
        status = 'completed',
        quality_rating = $1,
        speed_rating = $2,
        notes = COALESCE($3, notes),
        before_photos = $4,
        after_photos = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [quality_rating, speed_rating, notes, before_photos, after_photos, washId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car wash not found' });
    }

    // Update booking status
    await client.query(
      'UPDATE bookings SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['completed', result.rows[0].booking_id]
    );

    res.json({
      message: 'Car wash completed successfully',
      wash: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing car wash:', error);
    res.status(500).json({ error: 'Failed to complete car wash' });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/tracking/staff/{employeeId}/stats:
 *   get:
 *     summary: Get staff member's car wash statistics
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 */
router.get('/staff/:employeeId/stats', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { period = 'all' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = 'AND DATE(start_time) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'AND start_time >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'AND start_time >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
    }

    // Get overall statistics
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_washes,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_washes,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_washes,
        AVG(duration_minutes) FILTER (WHERE status = 'completed') as avg_duration_minutes,
        MIN(duration_minutes) FILTER (WHERE status = 'completed') as fastest_wash_minutes,
        MAX(duration_minutes) FILTER (WHERE status = 'completed') as slowest_wash_minutes,
        AVG(quality_rating) FILTER (WHERE quality_rating IS NOT NULL) as avg_quality_rating,
        AVG(speed_rating) FILTER (WHERE speed_rating IS NOT NULL) as avg_speed_rating,
        SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as total_hours_worked
      FROM staff_car_washes
      WHERE employee_id = $1 ${dateFilter}
    `, [employeeId]);

    // Get daily breakdown
    const dailyResult = await pool.query(`
      SELECT
        date,
        total_cars_washed,
        cars_completed,
        average_wash_duration,
        average_quality_rating,
        daily_rank
      FROM staff_daily_stats
      WHERE employee_id = $1
      ORDER BY date DESC
      LIMIT 30
    `, [employeeId]);

    // Get recent washes
    const recentWashes = await pool.query(`
      SELECT
        scw.*,
        b.booking_number,
        s.name as service_name,
        v.make || ' ' || v.model as vehicle_info
      FROM staff_car_washes scw
      LEFT JOIN bookings b ON scw.booking_id = b.id
      LEFT JOIN services s ON scw.service_id = s.id
      LEFT JOIN vehicles v ON scw.vehicle_id = v.id
      WHERE scw.employee_id = $1
      ORDER BY scw.start_time DESC
      LIMIT 10
    `, [employeeId]);

    // Get ranking among all staff
    const rankingResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE total_cars_washed > (
          SELECT SUM(total_cars_washed)
          FROM staff_daily_stats
          WHERE employee_id = $1
        )) + 1 as overall_rank,
        COUNT(DISTINCT employee_id) as total_staff
      FROM staff_daily_stats
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `, [employeeId]);

    res.json({
      employee_id: employeeId,
      period,
      overall_stats: statsResult.rows[0],
      daily_breakdown: dailyResult.rows,
      recent_washes: recentWashes.rows,
      ranking: rankingResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({ error: 'Failed to fetch staff statistics' });
  }
});

/**
 * @swagger
 * /api/tracking/staff/leaderboard:
 *   get:
 *     summary: Get staff leaderboard
 *     tags: [Tracking]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month]
 */
router.get('/staff/leaderboard', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = 'AND date = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'AND date >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'AND date >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
    }

    const result = await pool.query(`
      SELECT
        e.id as employee_id,
        e.employee_number,
        u.first_name,
        u.last_name,
        u.profile_picture,
        SUM(sds.total_cars_washed) as total_cars_washed,
        SUM(sds.cars_completed) as cars_completed,
        AVG(sds.average_wash_duration) as avg_duration,
        AVG(sds.average_quality_rating) as avg_quality_rating,
        AVG(sds.average_speed_rating) as avg_speed_rating,
        SUM(sds.total_work_minutes) as total_work_minutes,
        ROW_NUMBER() OVER (ORDER BY SUM(sds.total_cars_washed) DESC) as rank
      FROM staff_daily_stats sds
      JOIN employees e ON sds.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE e.is_active = true ${dateFilter}
      GROUP BY e.id, e.employee_number, u.first_name, u.last_name, u.profile_picture
      ORDER BY total_cars_washed DESC
      LIMIT 50
    `, []);

    res.json({
      period,
      leaderboard: result.rows
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// =============================================================================
// FLEET VEHICLE TRACKING ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/tracking/fleet/{vehicleId}/start-job:
 *   post:
 *     summary: Start tracking a job for a fleet vehicle
 *     tags: [Tracking]
 */
router.post('/fleet/:vehicleId/start-job', async (req, res) => {
  const client = await pool.connect();

  try {
    const { vehicleId } = req.params;
    const {
      driver_id,
      booking_id,
      service_id,
      customer_vehicle_id,
      start_location,
      odometer_start
    } = req.body;

    // Validate fleet vehicle exists
    const vehicleCheck = await client.query(
      'SELECT id FROM fleet_vehicles WHERE id = $1 AND is_active = true',
      [vehicleId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Fleet vehicle not found or inactive' });
    }

    // Start the job tracking
    const result = await client.query(`
      INSERT INTO fleet_vehicle_washes (
        fleet_vehicle_id, driver_id, booking_id, service_id, customer_vehicle_id,
        departure_time, start_location, odometer_start, status
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7, 'in_transit')
      RETURNING *
    `, [vehicleId, driver_id, booking_id, service_id, customer_vehicle_id, start_location, odometer_start]);

    res.status(201).json({
      message: 'Fleet job started successfully',
      job: result.rows[0]
    });
  } catch (error) {
    console.error('Error starting fleet job:', error);
    res.status(500).json({ error: 'Failed to start fleet job tracking' });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/tracking/fleet/job/{jobId}/update:
 *   put:
 *     summary: Update fleet job status and details
 *     tags: [Tracking]
 */
router.put('/fleet/job/:jobId/update', async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      status,
      arrival_time,
      service_start_time,
      service_end_time,
      return_time,
      end_location,
      distance_km,
      water_used_liters,
      fuel_used_liters,
      supplies_used,
      odometer_end,
      notes
    } = req.body;

    const result = await pool.query(`
      UPDATE fleet_vehicle_washes
      SET
        status = COALESCE($1, status),
        arrival_time = COALESCE($2, arrival_time),
        service_start_time = COALESCE($3, service_start_time),
        service_end_time = COALESCE($4, service_end_time),
        return_time = COALESCE($5, return_time),
        end_location = COALESCE($6, end_location),
        distance_km = COALESCE($7, distance_km),
        water_used_liters = COALESCE($8, water_used_liters),
        fuel_used_liters = COALESCE($9, fuel_used_liters),
        supplies_used = COALESCE($10, supplies_used),
        odometer_end = COALESCE($11, odometer_end),
        notes = COALESCE($12, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      status, arrival_time, service_start_time, service_end_time, return_time,
      end_location, distance_km, water_used_liters, fuel_used_liters,
      supplies_used, odometer_end, notes, jobId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fleet job not found' });
    }

    res.json({
      message: 'Fleet job updated successfully',
      job: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating fleet job:', error);
    res.status(500).json({ error: 'Failed to update fleet job' });
  }
});

/**
 * @swagger
 * /api/tracking/fleet/{vehicleId}/stats:
 *   get:
 *     summary: Get fleet vehicle usage statistics
 *     tags: [Tracking]
 */
router.get('/fleet/:vehicleId/stats', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { period = 'all' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = 'AND DATE(departure_time) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'AND departure_time >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'AND departure_time >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
    }

    // Get overall statistics
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_jobs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        SUM(distance_km) as total_distance_km,
        AVG(distance_km) as avg_distance_per_job,
        SUM(water_used_liters) as total_water_used,
        SUM(fuel_used_liters) as total_fuel_used,
        CASE
          WHEN SUM(fuel_used_liters) > 0
          THEN SUM(distance_km) / SUM(fuel_used_liters)
          ELSE NULL
        END as fuel_efficiency,
        COUNT(DISTINCT driver_id) as unique_drivers
      FROM fleet_vehicle_washes
      WHERE fleet_vehicle_id = $1 ${dateFilter}
    `, [vehicleId]);

    // Get daily breakdown
    const dailyResult = await pool.query(`
      SELECT
        date,
        total_washes,
        washes_completed,
        total_distance_km,
        total_fuel_used,
        fuel_efficiency,
        utilization_percentage
      FROM fleet_vehicle_daily_stats
      WHERE fleet_vehicle_id = $1
      ORDER BY date DESC
      LIMIT 30
    `, [vehicleId]);

    // Get recent jobs
    const recentJobs = await pool.query(`
      SELECT
        fvw.*,
        b.booking_number,
        u.first_name || ' ' || u.last_name as driver_name
      FROM fleet_vehicle_washes fvw
      LEFT JOIN bookings b ON fvw.booking_id = b.id
      LEFT JOIN employees e ON fvw.driver_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE fvw.fleet_vehicle_id = $1
      ORDER BY fvw.departure_time DESC
      LIMIT 10
    `, [vehicleId]);

    res.json({
      vehicle_id: vehicleId,
      period,
      overall_stats: statsResult.rows[0],
      daily_breakdown: dailyResult.rows,
      recent_jobs: recentJobs.rows
    });
  } catch (error) {
    console.error('Error fetching fleet stats:', error);
    res.status(500).json({ error: 'Failed to fetch fleet statistics' });
  }
});

/**
 * @swagger
 * /api/tracking/fleet/leaderboard:
 *   get:
 *     summary: Get fleet vehicle performance leaderboard
 *     tags: [Tracking]
 */
router.get('/fleet/leaderboard', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = 'AND date = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'AND date >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'AND date >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
    }

    const result = await pool.query(`
      SELECT
        fv.id as vehicle_id,
        fv.vehicle_name,
        fv.make,
        fv.model,
        fv.license_plate,
        SUM(fvds.total_washes) as total_washes,
        SUM(fvds.washes_completed) as washes_completed,
        SUM(fvds.total_distance_km) as total_distance_km,
        AVG(fvds.fuel_efficiency) as avg_fuel_efficiency,
        SUM(fvds.total_water_used) as total_water_used,
        SUM(fvds.total_fuel_used) as total_fuel_used,
        AVG(fvds.utilization_percentage) as avg_utilization,
        ROW_NUMBER() OVER (ORDER BY SUM(fvds.total_washes) DESC) as rank
      FROM fleet_vehicle_daily_stats fvds
      JOIN fleet_vehicles fv ON fvds.fleet_vehicle_id = fv.id
      WHERE fv.is_active = true ${dateFilter}
      GROUP BY fv.id, fv.vehicle_name, fv.make, fv.model, fv.license_plate
      ORDER BY total_washes DESC
      LIMIT 50
    `, []);

    res.json({
      period,
      leaderboard: result.rows
    });
  } catch (error) {
    console.error('Error fetching fleet leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch fleet leaderboard' });
  }
});

// =============================================================================
// COMBINED ANALYTICS
// =============================================================================

/**
 * @swagger
 * /api/tracking/dashboard:
 *   get:
 *     summary: Get combined dashboard statistics
 *     tags: [Tracking]
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { period = 'today' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = 'date = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'date >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'date >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
    }

    // Staff summary
    const staffSummary = await pool.query(`
      SELECT
        COUNT(DISTINCT employee_id) as active_staff,
        SUM(total_cars_washed) as total_cars_washed,
        AVG(average_wash_duration) as avg_wash_duration,
        AVG(average_quality_rating) as avg_quality_rating
      FROM staff_daily_stats
      WHERE ${dateFilter}
    `);

    // Fleet summary
    const fleetSummary = await pool.query(`
      SELECT
        COUNT(DISTINCT fleet_vehicle_id) as active_vehicles,
        SUM(total_washes) as total_washes,
        SUM(total_distance_km) as total_distance_km,
        AVG(fuel_efficiency) as avg_fuel_efficiency
      FROM fleet_vehicle_daily_stats
      WHERE ${dateFilter}
    `);

    // Top performers
    const topStaff = await pool.query(`
      SELECT
        e.employee_number,
        u.first_name || ' ' || u.last_name as name,
        SUM(sds.total_cars_washed) as cars_washed
      FROM staff_daily_stats sds
      JOIN employees e ON sds.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE ${dateFilter}
      GROUP BY e.id, e.employee_number, u.first_name, u.last_name
      ORDER BY cars_washed DESC
      LIMIT 5
    `);

    const topVehicles = await pool.query(`
      SELECT
        fv.vehicle_name,
        fv.license_plate,
        SUM(fvds.total_washes) as total_washes
      FROM fleet_vehicle_daily_stats fvds
      JOIN fleet_vehicles fv ON fvds.fleet_vehicle_id = fv.id
      WHERE ${dateFilter}
      GROUP BY fv.id, fv.vehicle_name, fv.license_plate
      ORDER BY total_washes DESC
      LIMIT 5
    `);

    res.json({
      period,
      staff_summary: staffSummary.rows[0],
      fleet_summary: fleetSummary.rows[0],
      top_staff: topStaff.rows,
      top_vehicles: topVehicles.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
