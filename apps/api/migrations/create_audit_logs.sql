-- Create audit_logs table for tracking all user actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'read'
  entity_type VARCHAR(50) NOT NULL, -- 'user', 'booking', 'service', etc.
  entity_id INTEGER,
  old_values JSONB, -- Previous values for updates
  new_values JSONB, -- New values for creates/updates
  ip_address VARCHAR(45),
  user_agent TEXT,
  path VARCHAR(255),
  method VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_composite ON audit_logs(user_id, entity_type, created_at);

-- Create a view for recent audit logs with user details
CREATE OR REPLACE VIEW audit_logs_with_user AS
SELECT
  al.*,
  u.name as user_name,
  u.email as user_email,
  u.role as user_role
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC;

-- Add comment to table
COMMENT ON TABLE audit_logs IS 'Audit trail for all user actions in the system';
COMMENT ON COLUMN audit_logs.old_values IS 'JSONB snapshot of entity before modification';
COMMENT ON COLUMN audit_logs.new_values IS 'JSONB snapshot of entity after modification';

-- Optional: Create partitions for better performance (if you expect millions of logs)
-- Partition by month
-- CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
