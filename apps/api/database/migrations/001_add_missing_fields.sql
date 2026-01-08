-- Migration: Add missing fields for API compatibility
-- Date: December 30, 2024
-- Version: 1.0.0

-- =============================================================================
-- Add missing fields to bookings table
-- =============================================================================

-- Add scheduled_time if it doesn't exist (for time-based scheduling)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'scheduled_time'
    ) THEN
        ALTER TABLE bookings ADD COLUMN scheduled_time VARCHAR(10);
        COMMENT ON COLUMN bookings.scheduled_time IS 'Time slot for the booking (e.g., 10:00 AM)';
    END IF;
END $$;

-- Rename total_amount to total_price for consistency with API
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'total_amount'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'total_price'
    ) THEN
        ALTER TABLE bookings RENAME COLUMN total_amount TO total_price;
    END IF;
END $$;

-- Add assigned_to column if not exists (for staff assignment)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'assigned_to'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'assigned_staff_id'
    ) THEN
        ALTER TABLE bookings RENAME COLUMN assigned_staff_id TO assigned_to;
    END IF;
END $$;

-- Ensure payment_status has correct values
DO $$
BEGIN
    -- Add check constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_payment_status_check'
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_payment_status_check
        CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));
    END IF;
END $$;

-- Ensure status has correct values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_status_check'
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_status_check
        CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));
    END IF;
END $$;

-- =============================================================================
-- Add missing fields to services table
-- =============================================================================

-- Rename duration_minutes to duration for consistency
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'services' AND column_name = 'duration_minutes'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'services' AND column_name = 'duration'
    ) THEN
        ALTER TABLE services RENAME COLUMN duration_minutes TO duration;
    END IF;
END $$;

-- =============================================================================
-- Create analytics_snapshots table for caching
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_date DATE NOT NULL,
    timeframe VARCHAR(20) NOT NULL, -- 'today', 'week', 'month', 'year'
    total_users INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    active_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,
    pending_bookings INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    avg_order_value DECIMAL(10, 2) DEFAULT 0,
    revenue_by_service JSONB,
    revenue_by_day JSONB,
    top_services JSONB,
    customer_growth JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE analytics_snapshots IS 'Cached analytics data for performance optimization';

-- Create index on date and timeframe for fast lookups
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date_timeframe
ON analytics_snapshots(snapshot_date, timeframe);

-- =============================================================================
-- Additional indexes for improved query performance
-- =============================================================================

-- Booking indexes for our API queries
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_updated_at ON bookings(updated_at);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Service indexes
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);

-- User indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_created_at ON users(role, created_at);

-- Composite index for common booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_status_scheduled_date
ON bookings(status, scheduled_date);

-- =============================================================================
-- Update triggers for new tables
-- =============================================================================

-- Trigger for analytics_snapshots updated_at
CREATE TRIGGER update_analytics_snapshots_updated_at
BEFORE UPDATE ON analytics_snapshots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Functions for analytics calculations
-- =============================================================================

-- Function to calculate booking statistics
CREATE OR REPLACE FUNCTION calculate_booking_stats(
    p_start_date TIMESTAMP,
    p_end_date TIMESTAMP
)
RETURNS TABLE (
    total_count BIGINT,
    total_revenue DECIMAL(10, 2),
    avg_value DECIMAL(10, 2),
    by_status JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_count,
        COALESCE(SUM(total_price), 0)::DECIMAL(10, 2) as total_revenue,
        COALESCE(AVG(total_price), 0)::DECIMAL(10, 2) as avg_value,
        jsonb_object_agg(
            status,
            count
        ) as by_status
    FROM bookings
    WHERE created_at >= p_start_date
      AND created_at <= p_end_date
    GROUP BY status;
END;
$$ LANGUAGE plpgsql;

-- Function to get service statistics
CREATE OR REPLACE FUNCTION get_service_stats(p_service_id UUID)
RETURNS TABLE (
    total_bookings BIGINT,
    total_revenue DECIMAL(10, 2),
    avg_revenue DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_bookings,
        COALESCE(SUM(b.total_price), 0)::DECIMAL(10, 2) as total_revenue,
        COALESCE(AVG(b.total_price), 0)::DECIMAL(10, 2) as avg_revenue
    FROM bookings b
    WHERE b.service_id = p_service_id
      AND b.status IN ('completed', 'in_progress');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Refresh materialized view for analytics (optional optimization)
-- =============================================================================

-- Create view for quick dashboard stats
CREATE OR REPLACE VIEW dashboard_stats_view AS
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM bookings) as total_bookings,
    (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status IN ('completed', 'in_progress')) as total_revenue,
    (SELECT COUNT(*) FROM bookings WHERE status IN ('confirmed', 'in_progress')) as active_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND DATE(updated_at) = CURRENT_DATE) as completed_today,
    (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings;

COMMENT ON VIEW dashboard_stats_view IS 'Quick view for dashboard statistics';

-- =============================================================================
-- Data validation and cleanup
-- =============================================================================

-- Ensure all existing bookings have valid status values
UPDATE bookings
SET status = 'pending'
WHERE status IS NULL OR status NOT IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- Ensure all existing bookings have valid payment_status values
UPDATE bookings
SET payment_status = 'pending'
WHERE payment_status IS NULL OR payment_status NOT IN ('pending', 'paid', 'refunded', 'failed');

-- =============================================================================
-- Permissions
-- =============================================================================

-- Grant permissions on new table
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_snapshots TO authenticated;
GRANT SELECT ON dashboard_stats_view TO authenticated;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION calculate_booking_stats(TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_service_stats(UUID) TO authenticated;

-- =============================================================================
-- Update schema version
-- =============================================================================

INSERT INTO schema_version (version, description)
VALUES ('2.1.0', 'Added missing fields, analytics snapshots table, and performance indexes')
ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- Migration complete
-- =============================================================================

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 001 completed successfully!';
    RAISE NOTICE 'Added analytics_snapshots table';
    RAISE NOTICE 'Added performance indexes';
    RAISE NOTICE 'Added helper functions for statistics';
    RAISE NOTICE 'Schema version updated to 2.1.0';
END $$;
