-- =============================================================================
-- QUICK FIX: Rename total_amount to total_price in bookings table
-- Run this in Supabase SQL Editor to fix the error
-- =============================================================================

-- This will rename the column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE bookings RENAME COLUMN total_amount TO total_price;
        RAISE NOTICE '✓ Successfully renamed total_amount to total_price';
    ELSE
        RAISE NOTICE '✓ Column total_price already exists';
    END IF;
END $$;

-- Verify the fix
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name = 'total_price';
