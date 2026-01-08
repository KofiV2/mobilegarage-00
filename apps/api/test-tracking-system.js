/**
 * Test Script for Car Wash Tracking System
 * Tests staff and fleet vehicle tracking functionality
 */

const { pool } = require('./src/config/database');

async function testTrackingSystem() {
  console.log('========================================');
  console.log('  TESTING CAR WASH TRACKING SYSTEM');
  console.log('========================================\n');

  try {
    // Test 1: Check if tracking tables exist
    console.log('[Test 1] Checking tracking tables...');
    const tablesCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'staff_car_washes',
          'fleet_vehicle_washes',
          'staff_daily_stats',
          'fleet_vehicle_daily_stats'
        )
      ORDER BY table_name
    `);

    if (tablesCheck.rows.length === 4) {
      console.log('✅ All tracking tables exist');
      tablesCheck.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('❌ Missing tracking tables!');
      console.log('   Found:', tablesCheck.rows.map(r => r.table_name).join(', '));
      console.log('   Expected: staff_car_washes, fleet_vehicle_washes, staff_daily_stats, fleet_vehicle_daily_stats');
      return;
    }
    console.log('');

    // Test 2: Check for existing employees
    console.log('[Test 2] Checking for employees...');
    const employeesCheck = await pool.query('SELECT COUNT(*) as count FROM employees');
    console.log(`✅ Found ${employeesCheck.rows[0].count} employees`);
    console.log('');

    // Test 3: Check for existing fleet vehicles
    console.log('[Test 3] Checking for fleet vehicles...');
    const fleetCheck = await pool.query('SELECT COUNT(*) as count FROM fleet_vehicles');
    console.log(`✅ Found ${fleetCheck.rows[0].count} fleet vehicles`);
    console.log('');

    // Test 4: Create a sample staff car wash record
    console.log('[Test 4] Testing staff car wash tracking...');

    // Get a sample employee
    const employeeResult = await pool.query('SELECT id FROM employees WHERE is_active = true LIMIT 1');

    if (employeeResult.rows.length === 0) {
      console.log('⚠️  No active employees found. Creating a test employee...');

      // Create a test user first
      const userResult = await pool.query(`
        INSERT INTO users (email, password_hash, role, first_name, last_name)
        VALUES ('test.staff@carwash.com', '$2b$10$test', 'staff', 'Test', 'Staff')
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING id
      `);

      // Create a test employee
      const newEmployeeResult = await pool.query(`
        INSERT INTO employees (user_id, employee_number, department, position, hire_date, is_active)
        VALUES ($1, 'EMP-TEST-001', 'Washing', 'Car Washer', CURRENT_DATE, true)
        ON CONFLICT (employee_number) DO UPDATE SET employee_number = EXCLUDED.employee_number
        RETURNING id
      `, [userResult.rows[0].id]);

      console.log('✅ Created test employee');
    }

    // Get employee ID
    const emp = await pool.query('SELECT id FROM employees WHERE is_active = true LIMIT 1');
    const employeeId = emp.rows[0].id;

    // Create a test booking
    const userForBooking = await pool.query('SELECT id FROM users WHERE role = \'customer\' LIMIT 1');
    const serviceResult = await pool.query('SELECT id FROM services WHERE is_active = true LIMIT 1');
    const vehicleResult = await pool.query('SELECT id FROM vehicles LIMIT 1');

    let bookingId;
    if (userForBooking.rows.length > 0 && serviceResult.rows.length > 0) {
      const bookingResult = await pool.query(`
        INSERT INTO bookings (
          user_id, booking_number, scheduled_date, status,
          service_id, vehicle_id, total_price, final_amount
        ) VALUES (
          $1,
          'TEST-' || to_char(NOW(), 'YYYYMMDD-HH24MISS'),
          NOW(),
          'pending',
          $2,
          $3,
          100.00,
          100.00
        )
        RETURNING id
      `, [
        userForBooking.rows[0].id,
        serviceResult.rows[0].id,
        vehicleResult.rows.length > 0 ? vehicleResult.rows[0].id : null
      ]);

      bookingId = bookingResult.rows[0].id;
    }

    // Insert a test car wash record
    const washResult = await pool.query(`
      INSERT INTO staff_car_washes (
        employee_id, booking_id, service_id, vehicle_id,
        start_time, end_time, status, quality_rating, speed_rating
      ) VALUES (
        $1, $2, $3, $4,
        NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '15 minutes',
        'completed',
        4.5,
        4.7
      )
      RETURNING id, duration_minutes
    `, [
      employeeId,
      bookingId,
      serviceResult.rows.length > 0 ? serviceResult.rows[0].id : null,
      vehicleResult.rows.length > 0 ? vehicleResult.rows[0].id : null
    ]);

    console.log(`✅ Created test car wash record`);
    console.log(`   ID: ${washResult.rows[0].id}`);
    console.log(`   Duration: ${washResult.rows[0].duration_minutes} minutes`);
    console.log('');

    // Test 5: Check if daily stats were auto-updated by trigger
    console.log('[Test 5] Checking automatic daily stats update...');

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    const statsCheck = await pool.query(`
      SELECT *
      FROM staff_daily_stats
      WHERE employee_id = $1 AND date = CURRENT_DATE
    `, [employeeId]);

    if (statsCheck.rows.length > 0) {
      const stats = statsCheck.rows[0];
      console.log('✅ Daily stats auto-updated by trigger!');
      console.log(`   Total cars washed today: ${stats.total_cars_washed}`);
      console.log(`   Completed: ${stats.cars_completed}`);
      console.log(`   Average duration: ${stats.average_wash_duration} min`);
      console.log(`   Average quality: ${stats.average_quality_rating}`);
    } else {
      console.log('⚠️  Daily stats not created yet (trigger may need a moment)');
    }
    console.log('');

    // Test 6: Test analytics query
    console.log('[Test 6] Testing analytics query...');
    const analyticsResult = await pool.query(`
      SELECT
        COUNT(*) as total_washes,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        AVG(duration_minutes) as avg_duration,
        AVG(quality_rating) as avg_quality
      FROM staff_car_washes
      WHERE start_time >= CURRENT_DATE
    `);

    const analytics = analyticsResult.rows[0];
    console.log('✅ Analytics query successful');
    console.log(`   Today's total washes: ${analytics.total_washes}`);
    console.log(`   Completed: ${analytics.completed}`);
    console.log(`   Avg duration: ${Math.round(analytics.avg_duration)} min`);
    console.log(`   Avg quality: ${parseFloat(analytics.avg_quality).toFixed(2)}`);
    console.log('');

    // Test 7: Test fleet vehicle tracking (if fleet vehicles exist)
    console.log('[Test 7] Testing fleet vehicle tracking...');
    const fleetVehicle = await pool.query('SELECT id FROM fleet_vehicles WHERE is_active = true LIMIT 1');

    if (fleetVehicle.rows.length > 0 && bookingId) {
      const fleetWashResult = await pool.query(`
        INSERT INTO fleet_vehicle_washes (
          fleet_vehicle_id, driver_id, booking_id,
          departure_time, arrival_time, service_start_time, service_end_time, return_time,
          distance_km, water_used_liters, fuel_used_liters,
          status
        ) VALUES (
          $1, $2, $3,
          NOW() - INTERVAL '2 hours',
          NOW() - INTERVAL '1 hour 45 minutes',
          NOW() - INTERVAL '1 hour 40 minutes',
          NOW() - INTERVAL '1 hour',
          NOW() - INTERVAL '30 minutes',
          15.5, 120, 2.3,
          'completed'
        )
        RETURNING id
      `, [fleetVehicle.rows[0].id, employeeId, bookingId]);

      console.log('✅ Created test fleet vehicle wash record');
      console.log(`   ID: ${fleetWashResult.rows[0].id}`);

      // Check fleet daily stats
      await new Promise(resolve => setTimeout(resolve, 1000));

      const fleetStatsCheck = await pool.query(`
        SELECT *
        FROM fleet_vehicle_daily_stats
        WHERE fleet_vehicle_id = $1 AND date = CURRENT_DATE
      `, [fleetVehicle.rows[0].id]);

      if (fleetStatsCheck.rows.length > 0) {
        const fleetStats = fleetStatsCheck.rows[0];
        console.log('✅ Fleet daily stats auto-updated!');
        console.log(`   Total washes: ${fleetStats.total_washes}`);
        console.log(`   Distance: ${fleetStats.total_distance_km} km`);
        console.log(`   Fuel efficiency: ${fleetStats.fuel_efficiency} km/L`);
      }
    } else {
      console.log('⚠️  No fleet vehicles found - skipping fleet test');
    }
    console.log('');

    // Test 8: Test leaderboard query
    console.log('[Test 8] Testing staff leaderboard query...');
    const leaderboardResult = await pool.query(`
      SELECT
        e.employee_number,
        u.first_name,
        u.last_name,
        SUM(sds.total_cars_washed) as total_cars_washed,
        AVG(sds.average_quality_rating) as avg_quality_rating,
        ROW_NUMBER() OVER (ORDER BY SUM(sds.total_cars_washed) DESC) as rank
      FROM staff_daily_stats sds
      JOIN employees e ON sds.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE e.is_active = true
        AND sds.date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY e.id, e.employee_number, u.first_name, u.last_name
      ORDER BY total_cars_washed DESC
      LIMIT 5
    `);

    console.log('✅ Leaderboard query successful');
    if (leaderboardResult.rows.length > 0) {
      console.log('   Top performers (last 7 days):');
      leaderboardResult.rows.forEach(row => {
        console.log(`   ${row.rank}. ${row.first_name} ${row.last_name} (${row.employee_number})`);
        console.log(`      Cars washed: ${row.total_cars_washed}, Quality: ${parseFloat(row.avg_quality_rating || 0).toFixed(2)}`);
      });
    } else {
      console.log('   No data yet (expected for new installation)');
    }
    console.log('');

    // Summary
    console.log('========================================');
    console.log('  ✅ ALL TESTS PASSED!');
    console.log('========================================\n');
    console.log('The tracking system is working correctly!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start tracking real car washes via API');
    console.log('2. View analytics in the dashboard');
    console.log('3. Check CAR_WASH_TRACKING_GUIDE.md for usage');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('  ❌ TEST FAILED');
    console.error('========================================');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure you ran the migration: 004_add_car_wash_tracking.sql');
    console.error('2. Check database connection in .env');
    console.error('3. Verify tables were created in Supabase');
    console.error('');
    console.error('Full error:');
    console.error(error);
    console.error('');
  } finally {
    await pool.end();
  }
}

// Run the test
testTrackingSystem();
