-- Migration: Fix total_price column naming
-- Date: December 31, 2024
-- Version: 2.1.1

-- =============================================================================
-- Rename total_amount to total_price in bookings table
-- =============================================================================

DO $$
BEGIN
    -- Check if total_amount exists and total_price doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'total_amount'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'total_price'
    ) THEN
        -- Rename the column
        ALTER TABLE bookings RENAME COLUMN total_amount TO total_price;
        RAISE NOTICE 'Successfully renamed total_amount to total_price';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'total_price'
    ) THEN
        RAISE NOTICE 'Column total_price already exists, no action needed';
    ELSE
        -- If neither exists, create total_price
        ALTER TABLE bookings ADD COLUMN total_price DECIMAL(10, 2);
        RAISE NOTICE 'Created total_price column';
    END IF;
END $$;

-- =============================================================================
-- Verify the column exists
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'total_price'
    ) THEN
        RAISE NOTICE 'Verification successful: total_price column exists';
    ELSE
        RAISE EXCEPTION 'Migration failed: total_price column does not exist';
    END IF;
END $$;

-- =============================================================================
-- Update schema version
-- =============================================================================

INSERT INTO schema_version (version, description)
VALUES ('2.1.1', 'Fixed total_price column naming in bookings table')
ON CONFLICT (version) DO NOTHING;
