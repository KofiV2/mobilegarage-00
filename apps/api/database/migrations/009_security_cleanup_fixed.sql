-- Migration: Security Cleanup - Fix Remaining Supabase Warnings (FIXED)
-- Date: 2026-01-07
-- Version: 2.5.0
-- Description: Fix all remaining security issues reported by Supabase Advisors

-- =============================================================================
-- FIX 1: Remove SECURITY DEFINER from service_history view
-- =============================================================================

DROP VIEW IF EXISTS service_history;

CREATE VIEW service_history AS
SELECT
    id,
    vehicle_id,
    booking_id,
    service_type,
    service_date,
    mileage,
    services_performed,
    products_used,
    technician_notes,
    before_photos,
    after_photos,
    cost,
    created_at
FROM vehicle_care_history;

COMMENT ON VIEW service_history IS 'Alias view for vehicle_care_history (non-SECURITY DEFINER)';
GRANT SELECT ON service_history TO authenticated;

-- =============================================================================
-- FIX 2: Enable RLS on Advanced Features Tables
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_assistants') THEN
        ALTER TABLE ai_assistants ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'gamification') THEN
        ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'social_feeds') THEN
        ALTER TABLE social_feeds ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'iot_devices') THEN
        ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'voice_commands') THEN
        ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'environmental_tracking') THEN
        ALTER TABLE environmental_tracking ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'advanced_analytics') THEN
        ALTER TABLE advanced_analytics ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customer_experience') THEN
        ALTER TABLE customer_experience ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enterprise_features') THEN
        ALTER TABLE enterprise_features ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketing_automation') THEN
        ALTER TABLE marketing_automation ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'advanced_payments') THEN
        ALTER TABLE advanced_payments ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'mobile_first_features') THEN
        ALTER TABLE mobile_first_features ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'integration_ecosystem') THEN
        ALTER TABLE integration_ecosystem ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tabby_tamara_integration') THEN
        ALTER TABLE tabby_tamara_integration ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enhanced_wallets') THEN
        ALTER TABLE enhanced_wallets ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'loyalty_punch_cards') THEN
        ALTER TABLE loyalty_punch_cards ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'staff_work_tracking') THEN
        ALTER TABLE staff_work_tracking ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customer_retention') THEN
        ALTER TABLE customer_retention ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'automated_rewards') THEN
        ALTER TABLE automated_rewards ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =============================================================================
-- FIX 3: Create Policies for Advanced Features Tables
-- =============================================================================

-- AI Assistants
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_assistants') THEN
        DROP POLICY IF EXISTS "ai_assistants_own" ON ai_assistants;
        CREATE POLICY "ai_assistants_own" ON ai_assistants FOR ALL USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "ai_assistants_admin" ON ai_assistants;
        CREATE POLICY "ai_assistants_admin" ON ai_assistants FOR ALL USING (is_admin());
    END IF;
END $$;

-- Gamification
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'gamification') THEN
        DROP POLICY IF EXISTS "gamification_own" ON gamification;
        CREATE POLICY "gamification_own" ON gamification FOR ALL USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "gamification_admin" ON gamification;
        CREATE POLICY "gamification_admin" ON gamification FOR ALL USING (is_admin());
    END IF;
END $$;

-- Social Feeds
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'social_feeds') THEN
        DROP POLICY IF EXISTS "social_feeds_select_public" ON social_feeds;
        CREATE POLICY "social_feeds_select_public" ON social_feeds FOR SELECT USING (is_public = true OR auth.uid() = user_id);
        DROP POLICY IF EXISTS "social_feeds_manage_own" ON social_feeds;
        CREATE POLICY "social_feeds_manage_own" ON social_feeds FOR INSERT WITH CHECK (auth.uid() = user_id);
        DROP POLICY IF EXISTS "social_feeds_update_own" ON social_feeds;
        CREATE POLICY "social_feeds_update_own" ON social_feeds FOR UPDATE USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "social_feeds_delete_own" ON social_feeds;
        CREATE POLICY "social_feeds_delete_own" ON social_feeds FOR DELETE USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "social_feeds_admin" ON social_feeds;
        CREATE POLICY "social_feeds_admin" ON social_feeds FOR ALL USING (is_admin());
    END IF;
END $$;

-- IoT Devices
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'iot_devices') THEN
        DROP POLICY IF EXISTS "iot_devices_select_staff" ON iot_devices;
        CREATE POLICY "iot_devices_select_staff" ON iot_devices FOR SELECT USING (is_staff());
        DROP POLICY IF EXISTS "iot_devices_all_admin" ON iot_devices;
        CREATE POLICY "iot_devices_all_admin" ON iot_devices FOR ALL USING (is_admin());
    END IF;
END $$;

-- Voice Commands
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'voice_commands') THEN
        DROP POLICY IF EXISTS "voice_commands_own" ON voice_commands;
        CREATE POLICY "voice_commands_own" ON voice_commands FOR ALL USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "voice_commands_admin" ON voice_commands;
        CREATE POLICY "voice_commands_admin" ON voice_commands FOR ALL USING (is_admin());
    END IF;
END $$;

-- Environmental Tracking
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'environmental_tracking') THEN
        DROP POLICY IF EXISTS "environmental_tracking_own" ON environmental_tracking;
        CREATE POLICY "environmental_tracking_own" ON environmental_tracking FOR ALL USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "environmental_tracking_admin" ON environmental_tracking;
        CREATE POLICY "environmental_tracking_admin" ON environmental_tracking FOR ALL USING (is_admin());
    END IF;
END $$;

-- Advanced Analytics
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'advanced_analytics') THEN
        DROP POLICY IF EXISTS "advanced_analytics_admin" ON advanced_analytics;
        CREATE POLICY "advanced_analytics_admin" ON advanced_analytics FOR ALL USING (is_admin());
    END IF;
END $$;

-- Customer Experience
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customer_experience') THEN
        DROP POLICY IF EXISTS "customer_experience_own" ON customer_experience;
        CREATE POLICY "customer_experience_own" ON customer_experience FOR ALL USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "customer_experience_admin" ON customer_experience;
        CREATE POLICY "customer_experience_admin" ON customer_experience FOR ALL USING (is_admin());
    END IF;
END $$;

-- Enterprise Features
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enterprise_features') THEN
        DROP POLICY IF EXISTS "enterprise_features_admin" ON enterprise_features;
        CREATE POLICY "enterprise_features_admin" ON enterprise_features FOR ALL USING (is_admin());
    END IF;
END $$;

-- Marketing Automation
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketing_automation') THEN
        DROP POLICY IF EXISTS "marketing_automation_admin" ON marketing_automation;
        CREATE POLICY "marketing_automation_admin" ON marketing_automation FOR ALL USING (is_admin());
    END IF;
END $$;

-- Advanced Payments
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'advanced_payments') THEN
        DROP POLICY IF EXISTS "advanced_payments_own" ON advanced_payments;
        CREATE POLICY "advanced_payments_own" ON advanced_payments FOR ALL USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "advanced_payments_admin" ON advanced_payments;
        CREATE POLICY "advanced_payments_admin" ON advanced_payments FOR ALL USING (is_admin());
    END IF;
END $$;

-- Mobile First Features
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'mobile_first_features') THEN
        DROP POLICY IF EXISTS "mobile_first_features_own" ON mobile_first_features;
        CREATE POLICY "mobile_first_features_own" ON mobile_first_features FOR ALL USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "mobile_first_features_admin" ON mobile_first_features;
        CREATE POLICY "mobile_first_features_admin" ON mobile_first_features FOR ALL USING (is_admin());
    END IF;
END $$;

-- Integration Ecosystem
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'integration_ecosystem') THEN
        DROP POLICY IF EXISTS "integration_ecosystem_admin" ON integration_ecosystem;
        CREATE POLICY "integration_ecosystem_admin" ON integration_ecosystem FOR ALL USING (is_admin());
    END IF;
END $$;

-- Tabby/Tamara Integration
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tabby_tamara_integration') THEN
        DROP POLICY IF EXISTS "tabby_tamara_integration_admin" ON tabby_tamara_integration;
        CREATE POLICY "tabby_tamara_integration_admin" ON tabby_tamara_integration FOR ALL USING (is_admin());
    END IF;
END $$;

-- Enhanced Wallets
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enhanced_wallets') THEN
        DROP POLICY IF EXISTS "enhanced_wallets_own" ON enhanced_wallets;
        CREATE POLICY "enhanced_wallets_own" ON enhanced_wallets FOR ALL USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "enhanced_wallets_admin" ON enhanced_wallets;
        CREATE POLICY "enhanced_wallets_admin" ON enhanced_wallets FOR ALL USING (is_admin());
    END IF;
END $$;

-- Loyalty Punch Cards
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'loyalty_punch_cards') THEN
        DROP POLICY IF EXISTS "loyalty_punch_cards_own" ON loyalty_punch_cards;
        CREATE POLICY "loyalty_punch_cards_own" ON loyalty_punch_cards FOR ALL USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "loyalty_punch_cards_admin" ON loyalty_punch_cards;
        CREATE POLICY "loyalty_punch_cards_admin" ON loyalty_punch_cards FOR ALL USING (is_admin());
    END IF;
END $$;

-- Staff Work Tracking
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'staff_work_tracking') THEN
        DROP POLICY IF EXISTS "staff_work_tracking_own" ON staff_work_tracking;
        CREATE POLICY "staff_work_tracking_own" ON staff_work_tracking FOR SELECT USING (
            EXISTS (SELECT 1 FROM employees WHERE employees.id = staff_work_tracking.employee_id AND employees.user_id = auth.uid())
        );
        DROP POLICY IF EXISTS "staff_work_tracking_admin" ON staff_work_tracking;
        CREATE POLICY "staff_work_tracking_admin" ON staff_work_tracking FOR ALL USING (is_admin());
    END IF;
END $$;

-- Customer Retention
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customer_retention') THEN
        DROP POLICY IF EXISTS "customer_retention_own" ON customer_retention;
        CREATE POLICY "customer_retention_own" ON customer_retention FOR ALL USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "customer_retention_admin" ON customer_retention;
        CREATE POLICY "customer_retention_admin" ON customer_retention FOR ALL USING (is_admin());
    END IF;
END $$;

-- Automated Rewards
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'automated_rewards') THEN
        DROP POLICY IF EXISTS "automated_rewards_admin" ON automated_rewards;
        CREATE POLICY "automated_rewards_admin" ON automated_rewards FOR ALL USING (is_admin());
    END IF;
END $$;

-- =============================================================================
-- FIX 4: Fix Function Search Path (outside DO block)
-- =============================================================================

-- Fix update_guest_bookings_updated_at function
DROP FUNCTION IF EXISTS update_guest_bookings_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_guest_bookings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

-- Recreate trigger if guest_bookings table exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'guest_bookings') THEN
        DROP TRIGGER IF EXISTS update_guest_bookings_updated_at ON guest_bookings;
        CREATE TRIGGER update_guest_bookings_updated_at
            BEFORE UPDATE ON guest_bookings
            FOR EACH ROW
            EXECUTE FUNCTION update_guest_bookings_updated_at();
    END IF;
END $$;

-- Fix other trigger functions
ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION update_user_booking_count() SET search_path = public, pg_temp;
ALTER FUNCTION update_service_stats() SET search_path = public, pg_temp;

-- Fix notification function if it exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_booking_status_change') THEN
        ALTER FUNCTION notify_booking_status_change() SET search_path = public, pg_temp;
    END IF;
END $$;

-- =============================================================================
-- FIX 5: Add default policies for tables with RLS but no policies
-- =============================================================================

DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN (
        SELECT t.tablename
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public'
        AND c.relrowsecurity = true
        AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename)
    ) LOOP
        EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (is_admin())', tbl_name || '_admin_only', tbl_name);
        RAISE NOTICE 'Added admin-only policy to table: %', tbl_name;
    END LOOP;
END $$;

-- =============================================================================
-- Update Schema Version
-- =============================================================================

INSERT INTO schema_version (version, description)
VALUES ('2.5.0', 'Security cleanup: Fixed SECURITY DEFINER view, enabled RLS on all advanced features tables, fixed function search_path, added missing policies')
ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
    tables_without_rls INTEGER;
    tables_with_rls_no_policy INTEGER;
    security_definer_views INTEGER;
BEGIN
    SELECT COUNT(*) INTO tables_without_rls
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename != 'schema_version'
    AND c.relrowsecurity = false;

    SELECT COUNT(*) INTO tables_with_rls_no_policy
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true
    AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename);

    SELECT COUNT(*) INTO security_definer_views
    FROM pg_views v
    WHERE v.schemaname = 'public'
    AND v.definition LIKE '%SECURITY DEFINER%';

    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Security Cleanup Migration Complete!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Tables without RLS: %', tables_without_rls;
    RAISE NOTICE 'Tables with RLS but no policies: %', tables_with_rls_no_policy;
    RAISE NOTICE 'SECURITY DEFINER views: %', security_definer_views;
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed Issues:';
    RAISE NOTICE '  ✓ Removed SECURITY DEFINER from service_history view';
    RAISE NOTICE '  ✓ Enabled RLS on all advanced features tables';
    RAISE NOTICE '  ✓ Created policies for all tables with RLS';
    RAISE NOTICE '  ✓ Fixed function search_path for security';
    RAISE NOTICE '  ✓ Added default admin-only policies where needed';
    RAISE NOTICE '';
    RAISE NOTICE 'Schema version updated to 2.5.0';
    RAISE NOTICE '=============================================================================';
    IF tables_without_rls = 0 AND tables_with_rls_no_policy = 0 AND security_definer_views = 0 THEN
        RAISE NOTICE '✅ ALL SECURITY WARNINGS SHOULD BE RESOLVED!';
    ELSE
        RAISE NOTICE '⚠️  Some tables may still need attention - check Supabase Advisors';
    END IF;
    RAISE NOTICE '=============================================================================';
END $$;
