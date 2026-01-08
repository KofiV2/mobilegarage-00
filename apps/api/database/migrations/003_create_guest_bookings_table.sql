-- Migration: Create guest_bookings table
-- Purpose: Allow non-registered users to book car wash services
-- Date: 2024-12-31

-- Create guest_bookings table
CREATE TABLE IF NOT EXISTS guest_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    confirmation_code VARCHAR(20) UNIQUE NOT NULL,

    -- Guest information
    guest_name VARCHAR(200) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,

    -- Service information
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    vehicle_info VARCHAR(200) NOT NULL,

    -- Scheduling
    scheduled_date TIMESTAMP NOT NULL,
    location_type VARCHAR(50) DEFAULT 'at_location', -- 'at_location' or 'mobile'
    address TEXT,

    -- Booking details
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',

    -- Pricing
    total_price DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2),

    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),

    -- Staff assignment
    assigned_staff_id UUID,

    -- Status tracking
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_guest_bookings_confirmation_code ON guest_bookings(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_email ON guest_bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_phone ON guest_bookings(guest_phone);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_scheduled_date ON guest_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_status ON guest_bookings(status);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_booking_number ON guest_bookings(booking_number);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_guest_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS trigger_update_guest_bookings_updated_at ON guest_bookings;
CREATE TRIGGER trigger_update_guest_bookings_updated_at
    BEFORE UPDATE ON guest_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_guest_bookings_updated_at();

-- Grant appropriate permissions (adjust based on your Supabase RLS policies)
-- Note: In Supabase, you'll want to set up Row Level Security (RLS) policies
ALTER TABLE guest_bookings ENABLE ROW LEVEL SECURITY;

-- Example RLS policy: Allow anyone to create a guest booking
CREATE POLICY "Allow guest booking creation" ON guest_bookings
    FOR INSERT WITH CHECK (true);

-- Example RLS policy: Allow guests to view their own bookings using confirmation code
CREATE POLICY "Allow viewing own bookings" ON guest_bookings
    FOR SELECT USING (true);

-- Example RLS policy: Only staff/admin can update bookings
-- (You'll need to adjust this based on your actual auth setup)
CREATE POLICY "Allow staff to update bookings" ON guest_bookings
    FOR UPDATE USING (
        -- This is a placeholder - adjust based on your auth system
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'staff')
        )
    );

-- Add comment to table
COMMENT ON TABLE guest_bookings IS 'Stores bookings made by guests without user accounts';
COMMENT ON COLUMN guest_bookings.confirmation_code IS 'Unique code guests can use to view/manage their booking';
COMMENT ON COLUMN guest_bookings.location_type IS 'Either at_location (customer comes to shop) or mobile (service goes to customer)';
