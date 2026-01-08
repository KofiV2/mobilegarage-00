-- ============================================================================
-- TRACKING ANALYTICS QUERIES
-- Comprehensive queries for staff and fleet vehicle tracking analysis
-- ============================================================================

-- ============================================================================
-- STAFF PERFORMANCE ANALYTICS
-- ============================================================================

-- 1. Get top performing staff members for current month
SELECT
    e.employee_number,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(scw.id) as total_washes,
    COUNT(*) FILTER (WHERE scw.status = 'completed') as completed_washes,
    AVG(scw.duration_minutes) as avg_duration_minutes,
    AVG(scw.quality_rating) as avg_quality_rating,
    AVG(scw.speed_rating) as avg_speed_rating,
    SUM(EXTRACT(EPOCH FROM (scw.end_time - scw.start_time)) / 3600) as total_hours_worked,
    RANK() OVER (ORDER BY COUNT(*) FILTER (WHERE scw.status = 'completed') DESC) as performance_rank
FROM employees e
JOIN users u ON e.user_id = u.id
LEFT JOIN staff_car_washes scw ON e.id = scw.employee_id
    AND scw.start_time >= DATE_TRUNC('month', CURRENT_DATE)
WHERE e.is_active = true
GROUP BY e.id, e.employee_number, u.first_name, u.last_name, u.email
ORDER BY completed_washes DESC
LIMIT 10;

-- 2. Staff productivity comparison - Today vs Yesterday
SELECT
    e.employee_number,
    u.first_name || ' ' || u.last_name as staff_name,
    today.total_cars_washed as today_washes,
    yesterday.total_cars_washed as yesterday_washes,
    today.total_cars_washed - COALESCE(yesterday.total_cars_washed, 0) as improvement,
    CASE
        WHEN yesterday.total_cars_washed > 0
        THEN ROUND(((today.total_cars_washed - yesterday.total_cars_washed)::NUMERIC / yesterday.total_cars_washed * 100), 2)
        ELSE NULL
    END as improvement_percentage
FROM employees e
JOIN users u ON e.user_id = u.id
LEFT JOIN staff_daily_stats today ON e.id = today.employee_id AND today.date = CURRENT_DATE
LEFT JOIN staff_daily_stats yesterday ON e.id = yesterday.employee_id AND yesterday.date = CURRENT_DATE - INTERVAL '1 day'
WHERE e.is_active = true
ORDER BY improvement DESC;

-- 3. Staff efficiency report - Cars washed per hour
SELECT
    e.employee_number,
    u.first_name || ' ' || u.last_name as staff_name,
    COUNT(scw.id) as total_washes,
    SUM(scw.duration_minutes) / 60.0 as total_hours,
    ROUND((COUNT(scw.id)::NUMERIC / NULLIF(SUM(scw.duration_minutes) / 60.0, 0)), 2) as cars_per_hour,
    AVG(scw.quality_rating) as avg_quality,
    CASE
        WHEN AVG(scw.quality_rating) >= 4.5 AND COUNT(scw.id)::NUMERIC / NULLIF(SUM(scw.duration_minutes) / 60.0, 0) >= 2
        THEN 'Excellent'
        WHEN AVG(scw.quality_rating) >= 3.5 AND COUNT(scw.id)::NUMERIC / NULLIF(SUM(scw.duration_minutes) / 60.0, 0) >= 1.5
        THEN 'Good'
        ELSE 'Needs Improvement'
    END as performance_grade
FROM employees e
JOIN users u ON e.user_id = u.id
LEFT JOIN staff_car_washes scw ON e.id = scw.employee_id
    AND scw.status = 'completed'
    AND scw.start_time >= CURRENT_DATE - INTERVAL '30 days'
WHERE e.is_active = true
GROUP BY e.id, e.employee_number, u.first_name, u.last_name
HAVING COUNT(scw.id) > 0
ORDER BY cars_per_hour DESC;

-- 4. Weekly performance trends for a specific staff member
-- Replace :employee_id with actual employee ID
SELECT
    DATE_TRUNC('week', scw.start_time) as week_start,
    COUNT(*) as total_washes,
    COUNT(*) FILTER (WHERE scw.status = 'completed') as completed,
    AVG(scw.duration_minutes) as avg_duration,
    AVG(scw.quality_rating) as avg_quality,
    MIN(scw.duration_minutes) as fastest_wash,
    MAX(scw.duration_minutes) as slowest_wash
FROM staff_car_washes scw
WHERE scw.employee_id = :employee_id
    AND scw.start_time >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', scw.start_time)
ORDER BY week_start DESC;

-- 5. Staff attendance vs performance correlation
SELECT
    e.employee_number,
    u.first_name || ' ' || u.last_name as staff_name,
    COUNT(DISTINCT DATE(a.check_in_time)) as days_worked,
    COUNT(scw.id) as total_washes,
    ROUND(COUNT(scw.id)::NUMERIC / NULLIF(COUNT(DISTINCT DATE(a.check_in_time)), 0), 2) as avg_washes_per_day,
    AVG(a.total_hours) as avg_hours_per_day,
    AVG(scw.quality_rating) as avg_quality
FROM employees e
JOIN users u ON e.user_id = u.id
LEFT JOIN attendance a ON e.id = a.employee_id
    AND a.date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN staff_car_washes scw ON e.id = scw.employee_id
    AND scw.status = 'completed'
    AND scw.start_time >= CURRENT_DATE - INTERVAL '30 days'
WHERE e.is_active = true
GROUP BY e.id, e.employee_number, u.first_name, u.last_name
HAVING COUNT(DISTINCT DATE(a.check_in_time)) > 0
ORDER BY avg_washes_per_day DESC;

-- ============================================================================
-- FLEET VEHICLE ANALYTICS
-- ============================================================================

-- 6. Fleet vehicle utilization report
SELECT
    fv.vehicle_name,
    fv.make || ' ' || fv.model as vehicle_info,
    fv.license_plate,
    COUNT(fvw.id) as total_jobs,
    COUNT(*) FILTER (WHERE fvw.status = 'completed') as completed_jobs,
    SUM(fvw.distance_km) as total_distance,
    SUM(fvw.fuel_used_liters) as total_fuel,
    ROUND(SUM(fvw.distance_km) / NULLIF(SUM(fvw.fuel_used_liters), 0), 2) as fuel_efficiency,
    SUM(fvw.water_used_liters) as total_water_used,
    ROUND(AVG(EXTRACT(EPOCH FROM (fvw.service_end_time - fvw.service_start_time)) / 60), 2) as avg_service_time_minutes,
    COUNT(DISTINCT fvw.driver_id) as unique_drivers,
    RANK() OVER (ORDER BY COUNT(*) FILTER (WHERE fvw.status = 'completed') DESC) as utilization_rank
FROM fleet_vehicles fv
LEFT JOIN fleet_vehicle_washes fvw ON fv.id = fvw.fleet_vehicle_id
    AND fvw.departure_time >= CURRENT_DATE - INTERVAL '30 days'
WHERE fv.is_active = true
GROUP BY fv.id, fv.vehicle_name, fv.make, fv.model, fv.license_plate
ORDER BY completed_jobs DESC;

-- 7. Fleet maintenance needs prediction
SELECT
    fv.vehicle_name,
    fv.license_plate,
    fv.mileage as current_mileage,
    SUM(fvw.odometer_end - fvw.odometer_start) as monthly_km_added,
    fv.maintenance_due_date,
    CURRENT_DATE - fv.maintenance_due_date as days_overdue,
    AVG(fvds.fuel_efficiency) as avg_fuel_efficiency,
    CASE
        WHEN AVG(fvds.fuel_efficiency) < 8 THEN 'Low efficiency - check engine'
        WHEN fv.maintenance_due_date < CURRENT_DATE THEN 'Maintenance overdue'
        WHEN fv.maintenance_due_date < CURRENT_DATE + INTERVAL '7 days' THEN 'Maintenance due soon'
        ELSE 'OK'
    END as maintenance_alert
FROM fleet_vehicles fv
LEFT JOIN fleet_vehicle_washes fvw ON fv.id = fvw.fleet_vehicle_id
    AND fvw.departure_time >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN fleet_vehicle_daily_stats fvds ON fv.id = fvds.fleet_vehicle_id
    AND fvds.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE fv.is_active = true
GROUP BY fv.id, fv.vehicle_name, fv.license_plate, fv.mileage, fv.maintenance_due_date
ORDER BY days_overdue DESC NULLS LAST;

-- 8. Driver performance with fleet vehicles
SELECT
    e.employee_number,
    u.first_name || ' ' || u.last_name as driver_name,
    fv.vehicle_name,
    COUNT(fvw.id) as total_trips,
    SUM(fvw.distance_km) as total_distance,
    AVG(fvw.distance_km) as avg_distance_per_trip,
    ROUND(SUM(fvw.distance_km) / NULLIF(SUM(fvw.fuel_used_liters), 0), 2) as fuel_efficiency,
    AVG(EXTRACT(EPOCH FROM (fvw.arrival_time - fvw.departure_time)) / 60) as avg_travel_time_minutes,
    COUNT(*) FILTER (WHERE fvw.status = 'completed') as completed_trips,
    ROUND((COUNT(*) FILTER (WHERE fvw.status = 'completed')::NUMERIC / NULLIF(COUNT(fvw.id), 0) * 100), 2) as completion_rate
FROM employees e
JOIN users u ON e.user_id = u.id
LEFT JOIN fleet_vehicle_washes fvw ON e.id = fvw.driver_id
    AND fvw.departure_time >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN fleet_vehicles fv ON fvw.fleet_vehicle_id = fv.id
WHERE e.is_active = true AND fvw.id IS NOT NULL
GROUP BY e.id, e.employee_number, u.first_name, u.last_name, fv.vehicle_name
ORDER BY total_trips DESC;

-- 9. Cost analysis per fleet vehicle
SELECT
    fv.vehicle_name,
    fv.license_plate,
    COUNT(fvw.id) as total_jobs,
    SUM(fvw.distance_km) as total_km,
    SUM(fvw.fuel_used_liters) as total_fuel_liters,
    -- Assuming average fuel cost of $1.50 per liter
    ROUND(SUM(fvw.fuel_used_liters) * 1.50, 2) as estimated_fuel_cost,
    -- Assuming water cost
    ROUND(SUM(fvw.water_used_liters) * 0.01, 2) as estimated_water_cost,
    -- Total estimated operating cost
    ROUND((SUM(fvw.fuel_used_liters) * 1.50) + (SUM(fvw.water_used_liters) * 0.01), 2) as total_operating_cost,
    -- Cost per job
    ROUND(((SUM(fvw.fuel_used_liters) * 1.50) + (SUM(fvw.water_used_liters) * 0.01)) / NULLIF(COUNT(fvw.id), 0), 2) as cost_per_job
FROM fleet_vehicles fv
LEFT JOIN fleet_vehicle_washes fvw ON fv.id = fvw.fleet_vehicle_id
    AND fvw.departure_time >= CURRENT_DATE - INTERVAL '30 days'
    AND fvw.status = 'completed'
WHERE fv.is_active = true
GROUP BY fv.id, fv.vehicle_name, fv.license_plate
ORDER BY total_operating_cost DESC;

-- ============================================================================
-- COMBINED ANALYTICS
-- ============================================================================

-- 10. Daily business summary
SELECT
    CURRENT_DATE as report_date,
    -- Staff metrics
    (SELECT COUNT(DISTINCT employee_id) FROM staff_daily_stats WHERE date = CURRENT_DATE) as active_staff_today,
    (SELECT SUM(total_cars_washed) FROM staff_daily_stats WHERE date = CURRENT_DATE) as total_cars_washed_by_staff,
    (SELECT AVG(average_quality_rating) FROM staff_daily_stats WHERE date = CURRENT_DATE) as avg_quality_rating,
    -- Fleet metrics
    (SELECT COUNT(DISTINCT fleet_vehicle_id) FROM fleet_vehicle_daily_stats WHERE date = CURRENT_DATE) as active_vehicles_today,
    (SELECT SUM(total_washes) FROM fleet_vehicle_daily_stats WHERE date = CURRENT_DATE) as total_washes_by_fleet,
    (SELECT SUM(total_distance_km) FROM fleet_vehicle_daily_stats WHERE date = CURRENT_DATE) as total_distance_covered,
    -- Combined
    (SELECT COUNT(*) FROM bookings WHERE DATE(scheduled_date) = CURRENT_DATE AND status = 'completed') as total_bookings_completed;

-- 11. Month-over-month comparison
WITH current_month AS (
    SELECT
        SUM(sds.total_cars_washed) as staff_washes,
        SUM(fvds.total_washes) as fleet_washes,
        COUNT(DISTINCT sds.employee_id) as active_staff,
        COUNT(DISTINCT fvds.fleet_vehicle_id) as active_vehicles
    FROM staff_daily_stats sds
    FULL OUTER JOIN fleet_vehicle_daily_stats fvds ON sds.date = fvds.date
    WHERE sds.date >= DATE_TRUNC('month', CURRENT_DATE)
),
previous_month AS (
    SELECT
        SUM(sds.total_cars_washed) as staff_washes,
        SUM(fvds.total_washes) as fleet_washes,
        COUNT(DISTINCT sds.employee_id) as active_staff,
        COUNT(DISTINCT fvds.fleet_vehicle_id) as active_vehicles
    FROM staff_daily_stats sds
    FULL OUTER JOIN fleet_vehicle_daily_stats fvds ON sds.date = fvds.date
    WHERE sds.date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND sds.date < DATE_TRUNC('month', CURRENT_DATE)
)
SELECT
    'Current Month' as period,
    cm.staff_washes,
    cm.fleet_washes,
    cm.staff_washes + cm.fleet_washes as total_washes,
    cm.active_staff,
    cm.active_vehicles,
    ROUND(((cm.staff_washes + cm.fleet_washes) - (pm.staff_washes + pm.fleet_washes))::NUMERIC /
        NULLIF(pm.staff_washes + pm.fleet_washes, 0) * 100, 2) as growth_percentage
FROM current_month cm, previous_month pm;

-- 12. Identify underperforming resources
SELECT
    'Staff' as resource_type,
    e.employee_number as identifier,
    u.first_name || ' ' || u.last_name as name,
    COALESCE(SUM(sds.total_cars_washed), 0) as monthly_output,
    'Below average' as status
FROM employees e
JOIN users u ON e.user_id = u.id
LEFT JOIN staff_daily_stats sds ON e.id = sds.employee_id
    AND sds.date >= DATE_TRUNC('month', CURRENT_DATE)
WHERE e.is_active = true
GROUP BY e.id, e.employee_number, u.first_name, u.last_name
HAVING COALESCE(SUM(sds.total_cars_washed), 0) < (
    SELECT AVG(total_washes) FROM (
        SELECT SUM(total_cars_washed) as total_washes
        FROM staff_daily_stats
        WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY employee_id
    ) as avg_calc
)

UNION ALL

SELECT
    'Fleet Vehicle' as resource_type,
    fv.license_plate as identifier,
    fv.vehicle_name as name,
    COALESCE(SUM(fvds.total_washes), 0) as monthly_output,
    'Below average' as status
FROM fleet_vehicles fv
LEFT JOIN fleet_vehicle_daily_stats fvds ON fv.id = fvds.fleet_vehicle_id
    AND fvds.date >= DATE_TRUNC('month', CURRENT_DATE)
WHERE fv.is_active = true
GROUP BY fv.id, fv.license_plate, fv.vehicle_name
HAVING COALESCE(SUM(fvds.total_washes), 0) < (
    SELECT AVG(total_washes) FROM (
        SELECT SUM(total_washes) as total_washes
        FROM fleet_vehicle_daily_stats
        WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY fleet_vehicle_id
    ) as avg_calc
)
ORDER BY monthly_output ASC;

-- 13. Peak hours analysis
SELECT
    EXTRACT(HOUR FROM scw.start_time) as hour_of_day,
    COUNT(*) as total_washes,
    COUNT(DISTINCT scw.employee_id) as staff_working,
    AVG(scw.duration_minutes) as avg_duration,
    COUNT(*) FILTER (WHERE scw.status = 'completed') as completed_washes
FROM staff_car_washes scw
WHERE scw.start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM scw.start_time)
ORDER BY hour_of_day;

-- 14. Quality trends over time
SELECT
    DATE_TRUNC('week', scw.start_time) as week,
    COUNT(*) as total_washes,
    AVG(scw.quality_rating) as avg_quality_rating,
    AVG(scw.speed_rating) as avg_speed_rating,
    COUNT(*) FILTER (WHERE scw.quality_rating >= 4.5) as excellent_washes,
    ROUND((COUNT(*) FILTER (WHERE scw.quality_rating >= 4.5)::NUMERIC / COUNT(*) * 100), 2) as excellence_percentage
FROM staff_car_washes scw
WHERE scw.start_time >= CURRENT_DATE - INTERVAL '12 weeks'
    AND scw.quality_rating IS NOT NULL
GROUP BY DATE_TRUNC('week', scw.start_time)
ORDER BY week DESC;

-- 15. Revenue attribution to staff and fleet
SELECT
    'Staff' as source,
    e.employee_number as identifier,
    u.first_name || ' ' || u.last_name as name,
    COUNT(scw.id) as total_jobs,
    SUM(b.final_amount) as total_revenue_generated,
    ROUND(AVG(b.final_amount), 2) as avg_revenue_per_job
FROM staff_car_washes scw
JOIN employees e ON scw.employee_id = e.id
JOIN users u ON e.user_id = u.id
LEFT JOIN bookings b ON scw.booking_id = b.id
WHERE scw.start_time >= CURRENT_DATE - INTERVAL '30 days'
    AND scw.status = 'completed'
GROUP BY e.id, e.employee_number, u.first_name, u.last_name

UNION ALL

SELECT
    'Fleet Vehicle' as source,
    fv.license_plate as identifier,
    fv.vehicle_name as name,
    COUNT(fvw.id) as total_jobs,
    SUM(b.final_amount) as total_revenue_generated,
    ROUND(AVG(b.final_amount), 2) as avg_revenue_per_job
FROM fleet_vehicle_washes fvw
JOIN fleet_vehicles fv ON fvw.fleet_vehicle_id = fv.id
LEFT JOIN bookings b ON fvw.booking_id = b.id
WHERE fvw.departure_time >= CURRENT_DATE - INTERVAL '30 days'
    AND fvw.status = 'completed'
GROUP BY fv.id, fv.license_plate, fv.vehicle_name
ORDER BY total_revenue_generated DESC;
