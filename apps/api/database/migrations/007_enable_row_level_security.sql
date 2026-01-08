-- Migration: Enable Row Level Security (RLS) on All Tables
-- Date: 2026-01-07
-- Version: 2.3.0
-- Description: Fix Supabase security warnings by enabling RLS and creating proper policies

-- =============================================================================
-- SECURITY NOTICE
-- =============================================================================
-- This migration enables Row Level Security (RLS) on all 36 tables and creates
-- appropriate policies based on user roles (customer, staff, admin).
--
-- After this migration:
-- - Customers can only access their own data
-- - Staff can access their work-related data
-- - Admins have full access to everything
-- - Public users (not authenticated) have very limited access
-- =============================================================================

-- =============================================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- =============================================================================

-- Core Business Tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Internal Management Tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_schedules ENABLE ROW LEVEL SECURITY;

-- Customer Engagement Tables
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_care_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- AI & Advanced Features Tables
ALTER TABLE ai_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_tracking ENABLE ROW LEVEL SECURITY;

-- Revolutionary Features Tables
ALTER TABLE advanced_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automation ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_first_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_ecosystem ENABLE ROW LEVEL SECURITY;

-- 2024 Features Tables
ALTER TABLE tabby_tamara_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_punch_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_work_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_retention ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_rewards ENABLE ROW LEVEL SECURITY;

-- Additional Tables (from previous migrations)
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 2: DROP EXISTING POLICIES (CLEAN SLATE)
-- =============================================================================

-- Drop all existing policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =============================================================================
-- STEP 3: CREATE HELPER FUNCTIONS FOR ROLE CHECKS
-- =============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is customer
CREATE OR REPLACE FUNCTION is_customer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'customer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN (
        SELECT role FROM users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 4: CORE BUSINESS TABLES POLICIES
-- =============================================================================

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Public: Anyone can sign up (insert their own user record)
CREATE POLICY "users_insert_own" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can view their own profile
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "users_select_admin" ON users
    FOR SELECT
    USING (is_admin());

-- Admins can update all users
CREATE POLICY "users_update_admin" ON users
    FOR UPDATE
    USING (is_admin());

-- Admins can delete users
CREATE POLICY "users_delete_admin" ON users
    FOR DELETE
    USING (is_admin());

-- Staff can view customer profiles (for bookings)
CREATE POLICY "users_select_staff" ON users
    FOR SELECT
    USING (is_staff() AND role = 'customer');

-- ============================================
-- VEHICLES TABLE POLICIES
-- ============================================

-- Users can view their own vehicles
CREATE POLICY "vehicles_select_own" ON vehicles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own vehicles
CREATE POLICY "vehicles_insert_own" ON vehicles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own vehicles
CREATE POLICY "vehicles_update_own" ON vehicles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own vehicles
CREATE POLICY "vehicles_delete_own" ON vehicles
    FOR DELETE
    USING (auth.uid() = user_id);

-- Staff can view all vehicles
CREATE POLICY "vehicles_select_staff" ON vehicles
    FOR SELECT
    USING (is_staff());

-- Admins can do everything
CREATE POLICY "vehicles_all_admin" ON vehicles
    FOR ALL
    USING (is_admin());

-- ============================================
-- SERVICES TABLE POLICIES
-- ============================================

-- Everyone (including public) can view active services
CREATE POLICY "services_select_public" ON services
    FOR SELECT
    USING (is_active = true);

-- Staff can view all services
CREATE POLICY "services_select_staff" ON services
    FOR SELECT
    USING (is_staff());

-- Admins can do everything
CREATE POLICY "services_insert_admin" ON services
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "services_update_admin" ON services
    FOR UPDATE
    USING (is_admin());

CREATE POLICY "services_delete_admin" ON services
    FOR DELETE
    USING (is_admin());

-- ============================================
-- BOOKINGS TABLE POLICIES
-- ============================================

-- Users can view their own bookings
CREATE POLICY "bookings_select_own" ON bookings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "bookings_insert_own" ON bookings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending bookings (cancel, etc.)
CREATE POLICY "bookings_update_own" ON bookings
    FOR UPDATE
    USING (auth.uid() = user_id AND status IN ('pending', 'confirmed'));

-- Staff can view all bookings
CREATE POLICY "bookings_select_staff" ON bookings
    FOR SELECT
    USING (is_staff());

-- Staff can update bookings (status, notes, etc.)
CREATE POLICY "bookings_update_staff" ON bookings
    FOR UPDATE
    USING (is_staff());

-- Admins can do everything
CREATE POLICY "bookings_all_admin" ON bookings
    FOR ALL
    USING (is_admin());

-- ============================================
-- REVIEWS TABLE POLICIES
-- ============================================

-- Everyone can view public reviews
CREATE POLICY "reviews_select_public" ON reviews
    FOR SELECT
    USING (is_public = true);

-- Users can view their own reviews
CREATE POLICY "reviews_select_own" ON reviews
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create reviews for their own bookings
CREATE POLICY "reviews_insert_own" ON reviews
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = reviews.booking_id
            AND bookings.user_id = auth.uid()
            AND bookings.status = 'completed'
        )
    );

-- Users can update their own reviews
CREATE POLICY "reviews_update_own" ON reviews
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "reviews_delete_own" ON reviews
    FOR DELETE
    USING (auth.uid() = user_id);

-- Staff can view all reviews
CREATE POLICY "reviews_select_staff" ON reviews
    FOR SELECT
    USING (is_staff());

-- Admins can do everything (including respond to reviews)
CREATE POLICY "reviews_all_admin" ON reviews
    FOR ALL
    USING (is_admin());

-- =============================================================================
-- STEP 5: INTERNAL MANAGEMENT TABLES POLICIES
-- =============================================================================

-- ============================================
-- EMPLOYEES TABLE POLICIES
-- ============================================

-- Employees can view their own record
CREATE POLICY "employees_select_own" ON employees
    FOR SELECT
    USING (auth.uid() = user_id);

-- Staff can view all employees
CREATE POLICY "employees_select_staff" ON employees
    FOR SELECT
    USING (is_staff());

-- Admins can do everything
CREATE POLICY "employees_all_admin" ON employees
    FOR ALL
    USING (is_admin());

-- ============================================
-- ATTENDANCE TABLE POLICIES
-- ============================================

-- Employees can view their own attendance
CREATE POLICY "attendance_select_own" ON attendance
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.id = attendance.employee_id
            AND employees.user_id = auth.uid()
        )
    );

-- Employees can insert their own attendance (check-in)
CREATE POLICY "attendance_insert_own" ON attendance
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.id = attendance.employee_id
            AND employees.user_id = auth.uid()
        )
    );

-- Employees can update their own attendance (check-out)
CREATE POLICY "attendance_update_own" ON attendance
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.id = attendance.employee_id
            AND employees.user_id = auth.uid()
        )
    );

-- Staff/Admins can view all attendance
CREATE POLICY "attendance_select_staff" ON attendance
    FOR SELECT
    USING (is_staff());

-- Admins can do everything
CREATE POLICY "attendance_all_admin" ON attendance
    FOR ALL
    USING (is_admin());

-- ============================================
-- PAYROLL TABLE POLICIES
-- ============================================

-- Employees can view their own payroll
CREATE POLICY "payroll_select_own" ON payroll
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.id = payroll.employee_id
            AND employees.user_id = auth.uid()
        )
    );

-- Admins only can manage payroll
CREATE POLICY "payroll_all_admin" ON payroll
    FOR ALL
    USING (is_admin());

-- ============================================
-- FLEET VEHICLES, INVENTORY, TRANSACTIONS POLICIES
-- (Admin/Staff only access)
-- ============================================

CREATE POLICY "fleet_vehicles_select_staff" ON fleet_vehicles
    FOR SELECT USING (is_staff());

CREATE POLICY "fleet_vehicles_all_admin" ON fleet_vehicles
    FOR ALL USING (is_admin());

CREATE POLICY "financial_transactions_select_own" ON financial_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "financial_transactions_select_staff" ON financial_transactions
    FOR SELECT USING (is_staff());

CREATE POLICY "financial_transactions_all_admin" ON financial_transactions
    FOR ALL USING (is_admin());

CREATE POLICY "inventory_items_select_staff" ON inventory_items
    FOR SELECT USING (is_staff());

CREATE POLICY "inventory_items_all_admin" ON inventory_items
    FOR ALL USING (is_admin());

CREATE POLICY "inventory_transactions_select_staff" ON inventory_transactions
    FOR SELECT USING (is_staff());

CREATE POLICY "inventory_transactions_all_admin" ON inventory_transactions
    FOR ALL USING (is_admin());

CREATE POLICY "smart_schedules_select_all" ON smart_schedules
    FOR SELECT USING (true); -- Public can view available slots

CREATE POLICY "smart_schedules_all_admin" ON smart_schedules
    FOR ALL USING (is_admin());

-- =============================================================================
-- STEP 6: CUSTOMER ENGAGEMENT TABLES POLICIES
-- =============================================================================

-- Loyalty Programs
CREATE POLICY "loyalty_programs_select_own" ON loyalty_programs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "loyalty_programs_select_staff" ON loyalty_programs
    FOR SELECT USING (is_staff());

CREATE POLICY "loyalty_programs_all_admin" ON loyalty_programs
    FOR ALL USING (is_admin());

-- Subscriptions
CREATE POLICY "subscriptions_select_own" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_select_staff" ON subscriptions
    FOR SELECT USING (is_staff());

CREATE POLICY "subscriptions_all_admin" ON subscriptions
    FOR ALL USING (is_admin());

-- Vehicle Care History
CREATE POLICY "vehicle_care_history_select_own" ON vehicle_care_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vehicles
            WHERE vehicles.id = vehicle_care_history.vehicle_id
            AND vehicles.user_id = auth.uid()
        )
    );

CREATE POLICY "vehicle_care_history_select_staff" ON vehicle_care_history
    FOR SELECT USING (is_staff());

CREATE POLICY "vehicle_care_history_all_admin" ON vehicle_care_history
    FOR ALL USING (is_admin());

-- Wallets
CREATE POLICY "wallets_select_own" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallets_update_own" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "wallets_select_admin" ON wallets
    FOR SELECT USING (is_admin());

-- =============================================================================
-- STEP 7: AI & ADVANCED FEATURES POLICIES (User-specific)
-- =============================================================================

-- All these tables: Users can only access their own data
CREATE POLICY "ai_assistants_own" ON ai_assistants
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "gamification_own" ON gamification
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "social_feeds_select_public" ON social_feeds
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "social_feeds_manage_own" ON social_feeds
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "social_feeds_update_own" ON social_feeds
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "social_feeds_delete_own" ON social_feeds
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "voice_commands_own" ON voice_commands
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "environmental_tracking_own" ON environmental_tracking
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "customer_experience_own" ON customer_experience
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "advanced_payments_own" ON advanced_payments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "mobile_first_features_own" ON mobile_first_features
    FOR ALL USING (auth.uid() = user_id);

-- Enhanced Wallets
CREATE POLICY "enhanced_wallets_own" ON enhanced_wallets
    FOR ALL USING (auth.uid() = user_id);

-- Loyalty Punch Cards
CREATE POLICY "loyalty_punch_cards_own" ON loyalty_punch_cards
    FOR ALL USING (auth.uid() = user_id);

-- Customer Retention
CREATE POLICY "customer_retention_own" ON customer_retention
    FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- STEP 8: ADMIN-ONLY TABLES POLICIES
-- =============================================================================

-- IoT Devices (Admin/Staff only)
CREATE POLICY "iot_devices_select_staff" ON iot_devices
    FOR SELECT USING (is_staff());

CREATE POLICY "iot_devices_all_admin" ON iot_devices
    FOR ALL USING (is_admin());

-- Advanced Analytics (Admin only)
CREATE POLICY "advanced_analytics_admin" ON advanced_analytics
    FOR ALL USING (is_admin());

-- Enterprise Features (Admin only)
CREATE POLICY "enterprise_features_admin" ON enterprise_features
    FOR ALL USING (is_admin());

-- Marketing Automation (Admin only)
CREATE POLICY "marketing_automation_admin" ON marketing_automation
    FOR ALL USING (is_admin());

-- Integration Ecosystem (Admin only)
CREATE POLICY "integration_ecosystem_admin" ON integration_ecosystem
    FOR ALL USING (is_admin());

-- Tabby/Tamara Integration (Admin only)
CREATE POLICY "tabby_tamara_integration_admin" ON tabby_tamara_integration
    FOR ALL USING (is_admin());

-- Staff Work Tracking
CREATE POLICY "staff_work_tracking_own" ON staff_work_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.id = staff_work_tracking.employee_id
            AND employees.user_id = auth.uid()
        )
    );

CREATE POLICY "staff_work_tracking_admin" ON staff_work_tracking
    FOR ALL USING (is_admin());

-- Automated Rewards (Admin only)
CREATE POLICY "automated_rewards_admin" ON automated_rewards
    FOR ALL USING (is_admin());

-- Analytics Snapshots (Admin/Staff read, Admin write)
CREATE POLICY "analytics_snapshots_select_staff" ON analytics_snapshots
    FOR SELECT USING (is_staff());

CREATE POLICY "analytics_snapshots_all_admin" ON analytics_snapshots
    FOR ALL USING (is_admin());

-- =============================================================================
-- STEP 9: SPECIAL POLICIES FOR API ACCESS
-- =============================================================================

-- Create a special policy for service role (used by API)
-- This allows your backend API to bypass RLS when using service role key

-- Note: Supabase automatically allows service role to bypass RLS
-- But we can create explicit policies if needed for clarity

-- =============================================================================
-- STEP 10: GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_staff() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_customer() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated, anon;

-- =============================================================================
-- STEP 11: CREATE SECURITY VIEWS
-- =============================================================================

-- View for users to see their own stats
CREATE OR REPLACE VIEW my_stats AS
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE user_id = u.id AND status = 'completed') as completed_bookings,
    (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE user_id = u.id AND status = 'completed') as total_spent,
    (SELECT points_balance FROM loyalty_programs WHERE user_id = u.id) as loyalty_points
FROM users u
WHERE u.id = auth.uid();

GRANT SELECT ON my_stats TO authenticated;

-- =============================================================================
-- STEP 12: UPDATE SCHEMA VERSION
-- =============================================================================

INSERT INTO schema_version (version, description)
VALUES ('2.3.0', 'Enabled Row Level Security (RLS) on all 36 tables with comprehensive role-based policies')
ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- VERIFICATION & SUMMARY
-- =============================================================================

DO $$
DECLARE
    total_tables INTEGER;
    tables_with_rls INTEGER;
    total_policies INTEGER;
BEGIN
    -- Count tables with RLS enabled
    SELECT COUNT(*)
    INTO total_tables
    FROM pg_tables
    WHERE schemaname = 'public';

    SELECT COUNT(*)
    INTO tables_with_rls
    FROM pg_tables t
    WHERE schemaname = 'public'
    AND EXISTS (
        SELECT 1 FROM pg_class c
        WHERE c.relname = t.tablename
        AND c.relrowsecurity = true
    );

    SELECT COUNT(*)
    INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'public';

    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Row Level Security (RLS) Migration Complete!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Total tables in public schema: %', total_tables;
    RAISE NOTICE 'Tables with RLS enabled: %', tables_with_rls;
    RAISE NOTICE 'Total security policies created: %', total_policies;
    RAISE NOTICE '';
    RAISE NOTICE 'Security Model:';
    RAISE NOTICE '  • Customers: Can only access their own data';
    RAISE NOTICE '  • Staff: Can access work-related data';
    RAISE NOTICE '  • Admins: Full access to everything';
    RAISE NOTICE '  • Public (unauthenticated): Very limited read-only access';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper Functions Created:';
    RAISE NOTICE '  • is_admin() - Check if current user is admin';
    RAISE NOTICE '  • is_staff() - Check if current user is staff';
    RAISE NOTICE '  • is_customer() - Check if current user is customer';
    RAISE NOTICE '  • current_user_role() - Get current user role';
    RAISE NOTICE '';
    RAISE NOTICE 'Schema version updated to 2.3.0';
    RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- IMPORTANT NOTES FOR DEVELOPERS
-- =============================================================================

COMMENT ON FUNCTION is_admin IS 'Helper function to check if current user is an admin. Use in RLS policies.';
COMMENT ON FUNCTION is_staff IS 'Helper function to check if current user is staff or admin. Use in RLS policies.';
COMMENT ON FUNCTION is_customer IS 'Helper function to check if current user is a customer. Use in RLS policies.';
COMMENT ON FUNCTION current_user_role IS 'Returns the role of the currently authenticated user.';

-- Note: When using your API with the service role key, RLS is automatically bypassed.
-- This is good for admin operations but be careful to validate permissions in your API code!

-- To test RLS policies:
-- 1. Create test users with different roles
-- 2. Use Supabase client with their JWT tokens
-- 3. Try to access different tables and verify policies work correctly
