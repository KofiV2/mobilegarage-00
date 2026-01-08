-- Migration: Add Car Wash Tracking for Staff and Fleet Vehicles
-- Purpose: Track how many cars each staff member washed and how many cars each fleet vehicle washed
-- Date: 2026-01-02

-- =============================================================================
-- STAFF CAR WASH TRACKING
-- =============================================================================

-- Table to track individual car wash jobs by staff members
CREATE TABLE IF NOT EXISTS staff_car_washes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Staff Information
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    -- Booking/Job Information
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- Service Information
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

    -- Time Tracking
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER, -- Calculated: end_time - start_time

    -- Performance Metrics
    quality_rating DECIMAL(3, 2) CHECK (quality_rating >= 0 AND quality_rating <= 5), -- From supervisor or customer
    speed_rating DECIMAL(3, 2) CHECK (speed_rating >= 0 AND speed_rating <= 5),

    -- Status
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, cancelled

    -- Additional Details
    notes TEXT,
    before_photos JSONB, -- Array of photo URLs
    after_photos JSONB, -- Array of photo URLs

    -- Location (if mobile wash)
    location JSONB,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_duration CHECK (end_time IS NULL OR end_time >= start_time)
);

-- =============================================================================
-- FLEET VEHICLE USAGE TRACKING
-- =============================================================================

-- Table to track car washes performed using fleet vehicles (mobile washing vans)
CREATE TABLE IF NOT EXISTS fleet_vehicle_washes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Fleet Vehicle Information
    fleet_vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,

    -- Driver/Staff Information
    driver_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    -- Booking/Job Information
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- Service Information
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    customer_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

    -- Location & Distance Tracking
    start_location JSONB, -- {lat, lng, address}
    end_location JSONB, -- {lat, lng, address}
    distance_km DECIMAL(10, 2), -- Distance traveled for this job

    -- Time Tracking
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP,
    service_start_time TIMESTAMP,
    service_end_time TIMESTAMP,
    return_time TIMESTAMP,

    -- Resource Usage
    water_used_liters DECIMAL(10, 2),
    fuel_used_liters DECIMAL(10, 2),
    supplies_used JSONB, -- {soap: 2, wax: 1, etc.}

    -- Vehicle Condition
    odometer_start INTEGER,
    odometer_end INTEGER,

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_transit, in_progress, completed, cancelled

    -- Additional Details
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_times CHECK (
        (arrival_time IS NULL OR arrival_time >= departure_time) AND
        (service_start_time IS NULL OR service_start_time >= departure_time) AND
        (service_end_time IS NULL OR service_end_time >= service_start_time) AND
        (return_time IS NULL OR return_time >= departure_time)
    )
);

-- =============================================================================
-- AGGREGATED STATISTICS TABLES (For Fast Queries)
-- =============================================================================

-- Staff Performance Summary (Daily)
CREATE TABLE IF NOT EXISTS staff_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Car Wash Counts
    total_cars_washed INTEGER DEFAULT 0,
    cars_completed INTEGER DEFAULT 0,
    cars_in_progress INTEGER DEFAULT 0,
    cars_cancelled INTEGER DEFAULT 0,

    -- Time Metrics
    total_work_minutes INTEGER DEFAULT 0,
    average_wash_duration DECIMAL(10, 2),
    fastest_wash_minutes INTEGER,
    slowest_wash_minutes INTEGER,

    -- Quality Metrics
    average_quality_rating DECIMAL(3, 2),
    average_speed_rating DECIMAL(3, 2),
    total_ratings_received INTEGER DEFAULT 0,

    -- Revenue Generated
    total_revenue DECIMAL(10, 2) DEFAULT 0,

    -- Rankings
    daily_rank INTEGER, -- Rank among all staff for this day

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: one record per employee per day
    CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);

-- Fleet Vehicle Usage Summary (Daily)
CREATE TABLE IF NOT EXISTS fleet_vehicle_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Usage Counts
    total_washes INTEGER DEFAULT 0,
    washes_completed INTEGER DEFAULT 0,
    washes_cancelled INTEGER DEFAULT 0,

    -- Distance & Travel
    total_distance_km DECIMAL(10, 2) DEFAULT 0,
    average_distance_per_wash DECIMAL(10, 2),

    -- Resource Usage
    total_water_used DECIMAL(10, 2) DEFAULT 0,
    total_fuel_used DECIMAL(10, 2) DEFAULT 0,
    fuel_efficiency DECIMAL(10, 2), -- km per liter

    -- Time Metrics
    total_service_minutes INTEGER DEFAULT 0,
    total_travel_minutes INTEGER DEFAULT 0,
    utilization_percentage DECIMAL(5, 2), -- % of work day used

    -- Vehicle Condition
    odometer_start INTEGER,
    odometer_end INTEGER,
    total_km_added INTEGER,

    -- Revenue Generated
    total_revenue DECIMAL(10, 2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: one record per vehicle per day
    CONSTRAINT unique_vehicle_date UNIQUE (fleet_vehicle_id, date)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Staff Car Washes Indexes
CREATE INDEX idx_staff_car_washes_employee ON staff_car_washes(employee_id);
CREATE INDEX idx_staff_car_washes_booking ON staff_car_washes(booking_id);
CREATE INDEX idx_staff_car_washes_status ON staff_car_washes(status);
CREATE INDEX idx_staff_car_washes_start_time ON staff_car_washes(start_time);
CREATE INDEX idx_staff_car_washes_date ON staff_car_washes(DATE(start_time));

-- Fleet Vehicle Washes Indexes
CREATE INDEX idx_fleet_washes_vehicle ON fleet_vehicle_washes(fleet_vehicle_id);
CREATE INDEX idx_fleet_washes_driver ON fleet_vehicle_washes(driver_id);
CREATE INDEX idx_fleet_washes_booking ON fleet_vehicle_washes(booking_id);
CREATE INDEX idx_fleet_washes_status ON fleet_vehicle_washes(status);
CREATE INDEX idx_fleet_washes_date ON fleet_vehicle_washes(DATE(departure_time));

-- Daily Stats Indexes
CREATE INDEX idx_staff_daily_stats_employee ON staff_daily_stats(employee_id);
CREATE INDEX idx_staff_daily_stats_date ON staff_daily_stats(date);
CREATE INDEX idx_fleet_daily_stats_vehicle ON fleet_vehicle_daily_stats(fleet_vehicle_id);
CREATE INDEX idx_fleet_daily_stats_date ON fleet_vehicle_daily_stats(date);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Function to update staff daily stats
CREATE OR REPLACE FUNCTION update_staff_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_date DATE;
    v_stats RECORD;
BEGIN
    -- Get the date from start_time
    v_date := DATE(COALESCE(NEW.start_time, OLD.start_time));

    -- Calculate statistics
    SELECT
        COUNT(*) as total_cars,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        SUM(duration_minutes) FILTER (WHERE status = 'completed') as total_minutes,
        AVG(duration_minutes) FILTER (WHERE status = 'completed') as avg_duration,
        MIN(duration_minutes) FILTER (WHERE status = 'completed') as min_duration,
        MAX(duration_minutes) FILTER (WHERE status = 'completed') as max_duration,
        AVG(quality_rating) FILTER (WHERE quality_rating IS NOT NULL) as avg_quality,
        AVG(speed_rating) FILTER (WHERE speed_rating IS NOT NULL) as avg_speed,
        COUNT(*) FILTER (WHERE quality_rating IS NOT NULL) as rating_count
    INTO v_stats
    FROM staff_car_washes
    WHERE employee_id = COALESCE(NEW.employee_id, OLD.employee_id)
        AND DATE(start_time) = v_date;

    -- Upsert daily stats
    INSERT INTO staff_daily_stats (
        employee_id, date,
        total_cars_washed, cars_completed, cars_in_progress, cars_cancelled,
        total_work_minutes, average_wash_duration, fastest_wash_minutes, slowest_wash_minutes,
        average_quality_rating, average_speed_rating, total_ratings_received
    ) VALUES (
        COALESCE(NEW.employee_id, OLD.employee_id), v_date,
        v_stats.total_cars, v_stats.completed, v_stats.in_progress, v_stats.cancelled,
        COALESCE(v_stats.total_minutes, 0), v_stats.avg_duration, v_stats.min_duration, v_stats.max_duration,
        v_stats.avg_quality, v_stats.avg_speed, v_stats.rating_count
    )
    ON CONFLICT (employee_id, date)
    DO UPDATE SET
        total_cars_washed = EXCLUDED.total_cars_washed,
        cars_completed = EXCLUDED.cars_completed,
        cars_in_progress = EXCLUDED.cars_in_progress,
        cars_cancelled = EXCLUDED.cars_cancelled,
        total_work_minutes = EXCLUDED.total_work_minutes,
        average_wash_duration = EXCLUDED.average_wash_duration,
        fastest_wash_minutes = EXCLUDED.fastest_wash_minutes,
        slowest_wash_minutes = EXCLUDED.slowest_wash_minutes,
        average_quality_rating = EXCLUDED.average_quality_rating,
        average_speed_rating = EXCLUDED.average_speed_rating,
        total_ratings_received = EXCLUDED.total_ratings_received,
        updated_at = CURRENT_TIMESTAMP;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for staff car washes
CREATE TRIGGER trigger_update_staff_daily_stats
AFTER INSERT OR UPDATE OR DELETE ON staff_car_washes
FOR EACH ROW
EXECUTE FUNCTION update_staff_daily_stats();

-- Function to update fleet vehicle daily stats
CREATE OR REPLACE FUNCTION update_fleet_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_date DATE;
    v_stats RECORD;
BEGIN
    -- Get the date from departure_time
    v_date := DATE(COALESCE(NEW.departure_time, OLD.departure_time));

    -- Calculate statistics
    SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        SUM(distance_km) as total_distance,
        AVG(distance_km) as avg_distance,
        SUM(water_used_liters) as total_water,
        SUM(fuel_used_liters) as total_fuel,
        CASE
            WHEN SUM(fuel_used_liters) > 0 THEN SUM(distance_km) / SUM(fuel_used_liters)
            ELSE NULL
        END as fuel_eff,
        SUM(EXTRACT(EPOCH FROM (service_end_time - service_start_time))/60) as service_mins,
        SUM(EXTRACT(EPOCH FROM (arrival_time - departure_time))/60) as travel_mins
    INTO v_stats
    FROM fleet_vehicle_washes
    WHERE fleet_vehicle_id = COALESCE(NEW.fleet_vehicle_id, OLD.fleet_vehicle_id)
        AND DATE(departure_time) = v_date;

    -- Upsert daily stats
    INSERT INTO fleet_vehicle_daily_stats (
        fleet_vehicle_id, date,
        total_washes, washes_completed, washes_cancelled,
        total_distance_km, average_distance_per_wash,
        total_water_used, total_fuel_used, fuel_efficiency,
        total_service_minutes, total_travel_minutes
    ) VALUES (
        COALESCE(NEW.fleet_vehicle_id, OLD.fleet_vehicle_id), v_date,
        v_stats.total, v_stats.completed, v_stats.cancelled,
        COALESCE(v_stats.total_distance, 0), v_stats.avg_distance,
        COALESCE(v_stats.total_water, 0), COALESCE(v_stats.total_fuel, 0), v_stats.fuel_eff,
        COALESCE(v_stats.service_mins, 0), COALESCE(v_stats.travel_mins, 0)
    )
    ON CONFLICT (fleet_vehicle_id, date)
    DO UPDATE SET
        total_washes = EXCLUDED.total_washes,
        washes_completed = EXCLUDED.washes_completed,
        washes_cancelled = EXCLUDED.washes_cancelled,
        total_distance_km = EXCLUDED.total_distance_km,
        average_distance_per_wash = EXCLUDED.average_distance_per_wash,
        total_water_used = EXCLUDED.total_water_used,
        total_fuel_used = EXCLUDED.total_fuel_used,
        fuel_efficiency = EXCLUDED.fuel_efficiency,
        total_service_minutes = EXCLUDED.total_service_minutes,
        total_travel_minutes = EXCLUDED.total_travel_minutes,
        updated_at = CURRENT_TIMESTAMP;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for fleet vehicle washes
CREATE TRIGGER trigger_update_fleet_daily_stats
AFTER INSERT OR UPDATE OR DELETE ON fleet_vehicle_washes
FOR EACH ROW
EXECUTE FUNCTION update_fleet_daily_stats();

-- Function to calculate duration when end_time is set
CREATE OR REPLACE FUNCTION calculate_wash_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate duration
CREATE TRIGGER trigger_calculate_wash_duration
BEFORE INSERT OR UPDATE ON staff_car_washes
FOR EACH ROW
EXECUTE FUNCTION calculate_wash_duration();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE staff_car_washes IS 'Tracks individual car washes performed by staff members';
COMMENT ON TABLE fleet_vehicle_washes IS 'Tracks car washes performed using fleet vehicles (mobile washing)';
COMMENT ON TABLE staff_daily_stats IS 'Aggregated daily statistics for staff performance';
COMMENT ON TABLE fleet_vehicle_daily_stats IS 'Aggregated daily statistics for fleet vehicle usage';

COMMENT ON COLUMN staff_car_washes.quality_rating IS 'Quality rating from supervisor or customer (0-5)';
COMMENT ON COLUMN staff_car_washes.speed_rating IS 'Speed/efficiency rating (0-5)';
COMMENT ON COLUMN fleet_vehicle_daily_stats.fuel_efficiency IS 'Calculated as km per liter (distance/fuel)';
COMMENT ON COLUMN staff_daily_stats.daily_rank IS 'Rank among all staff for this day based on cars washed';
