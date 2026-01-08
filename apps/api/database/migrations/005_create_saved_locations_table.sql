-- Migration: Create saved_locations table
-- Description: Allows users to save frequently used locations for quick booking
-- Date: 2026-01-03

-- Create saved_locations table
CREATE TABLE IF NOT EXISTS saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('home', 'work', 'gym', 'mall', 'friend', 'other')),
  emirate VARCHAR(50) NOT NULL,
  area VARCHAR(100),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_default ON saved_locations(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_saved_locations_type ON saved_locations(user_id, type);

-- Add constraint to ensure only one default location per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_locations_unique_default
  ON saved_locations(user_id)
  WHERE is_default = TRUE;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saved_locations_updated_at
  BEFORE UPDATE ON saved_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_locations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE saved_locations IS 'Stores user saved locations for quick booking';
COMMENT ON COLUMN saved_locations.type IS 'Location type: home, work, gym, mall, friend, other';
COMMENT ON COLUMN saved_locations.is_default IS 'Only one location can be default per user';
COMMENT ON COLUMN saved_locations.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN saved_locations.longitude IS 'GPS longitude coordinate';
