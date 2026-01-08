-- In and Out Car Wash Database Schema for Supabase (PostgreSQL)
-- Database: INANDOUT
-- Total Tables: 36 (All models converted to PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE BUSINESS TABLES (5)
-- =============================================================================

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    date_of_birth DATE,
    profile_picture TEXT,
    address JSONB,
    preferences JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicles Table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    color VARCHAR(50),
    license_plate VARCHAR(50) UNIQUE,
    vin VARCHAR(100),
    vehicle_type VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Services Table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    base_price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    features JSONB,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    location JSONB,
    total_price DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2),
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    notes TEXT,
    assigned_staff_id UUID,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photos JSONB,
    response TEXT,
    response_date TIMESTAMP,
    is_public BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INTERNAL MANAGEMENT TABLES (8)
-- =============================================================================

-- 6. Employees Table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    face_recognition_data JSONB,
    emergency_contact JSONB,
    documents JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Attendance Table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    check_in_method VARCHAR(50),
    check_out_method VARCHAR(50),
    check_in_location JSONB,
    check_out_location JSONB,
    total_hours DECIMAL(5, 2),
    status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Payroll Table
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary DECIMAL(10, 2),
    bonuses DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    overtime_pay DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2),
    payment_date DATE,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Fleet Vehicles Table
CREATE TABLE fleet_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_name VARCHAR(200),
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    license_plate VARCHAR(50) UNIQUE,
    vin VARCHAR(100),
    vehicle_type VARCHAR(50),
    current_location JSONB,
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    mileage INTEGER DEFAULT 0,
    fuel_level INTEGER,
    maintenance_due_date DATE,
    insurance_expiry DATE,
    is_active BOOLEAN DEFAULT TRUE,
    gps_device_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Financial Transactions Table
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_provider VARCHAR(100),
    transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    metadata JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Inventory Items Table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit_of_measure VARCHAR(50),
    quantity_in_stock INTEGER DEFAULT 0,
    reorder_level INTEGER,
    unit_cost DECIMAL(10, 2),
    supplier_info JSONB,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Inventory Transactions Table
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    reference_number VARCHAR(100),
    notes TEXT,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Smart Schedule Table
CREATE TABLE smart_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(100),
    date DATE NOT NULL,
    time_slots JSONB NOT NULL,
    capacity_per_slot INTEGER DEFAULT 5,
    bookings_count INTEGER DEFAULT 0,
    ai_predictions JSONB,
    weather_data JSONB,
    special_events JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- CUSTOMER ENGAGEMENT TABLES (4)
-- =============================================================================

-- 14. Loyalty Programs Table
CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points_balance INTEGER DEFAULT 0,
    points_earned_lifetime INTEGER DEFAULT 0,
    points_redeemed_lifetime INTEGER DEFAULT 0,
    tier_level VARCHAR(50) DEFAULT 'bronze',
    tier_benefits JSONB,
    points_history JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Subscriptions Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(50),
    price DECIMAL(10, 2),
    billing_cycle VARCHAR(50),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    auto_renew BOOLEAN DEFAULT TRUE,
    washes_included INTEGER,
    washes_used INTEGER DEFAULT 0,
    benefits JSONB,
    payment_method_id VARCHAR(100),
    next_billing_date DATE,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Vehicle Care History Table
CREATE TABLE vehicle_care_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    service_type VARCHAR(100),
    service_date DATE,
    mileage INTEGER,
    services_performed JSONB,
    products_used JSONB,
    technician_notes TEXT,
    before_photos JSONB,
    after_photos JSONB,
    cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Wallets Table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'SAR',
    transactions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- AI & ADVANCED FEATURES TABLES (6)
-- =============================================================================

-- 18. AI Assistant Table
CREATE TABLE ai_assistants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_history JSONB,
    preferences JSONB,
    last_interaction TIMESTAMP,
    total_interactions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Gamification Table
CREATE TABLE gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    achievements JSONB,
    badges JSONB,
    challenges JSONB,
    leaderboard_rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. Social Feed Table
CREATE TABLE social_feeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_type VARCHAR(50),
    content TEXT,
    media JSONB,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. IoT Devices Table
CREATE TABLE iot_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(200),
    device_type VARCHAR(100),
    location VARCHAR(200),
    status VARCHAR(50) DEFAULT 'active',
    last_reading JSONB,
    last_reading_time TIMESTAMP,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. Voice Commands Table
CREATE TABLE voice_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    command_text TEXT,
    intent VARCHAR(100),
    response TEXT,
    platform VARCHAR(50),
    success BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. Environmental Tracking Table
CREATE TABLE environmental_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_water_saved DECIMAL(10, 2) DEFAULT 0,
    total_co2_offset DECIMAL(10, 2) DEFAULT 0,
    eco_score INTEGER DEFAULT 0,
    eco_achievements JSONB,
    contributions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- REVOLUTIONARY FEATURES TABLES (7)
-- =============================================================================

-- 24. Advanced Analytics Table
CREATE TABLE advanced_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID,
    analytics_type VARCHAR(100),
    date_range JSONB,
    metrics JSONB,
    predictions JSONB,
    insights JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 25. Customer Experience Table
CREATE TABLE customer_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    personalization_data JSONB,
    preferences JSONB,
    interaction_history JSONB,
    sentiment_score INTEGER,
    vip_status BOOLEAN DEFAULT FALSE,
    concierge_services JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 26. Enterprise Features Table
CREATE TABLE enterprise_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL,
    locations JSONB,
    franchise_data JSONB,
    multi_location_config JSONB,
    reporting_config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 27. Marketing Automation Table
CREATE TABLE marketing_automation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID,
    campaigns JSONB,
    segments JSONB,
    email_templates JSONB,
    sms_templates JSONB,
    automation_rules JSONB,
    analytics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 28. Advanced Payments Table
CREATE TABLE advanced_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payment_methods JSONB,
    crypto_wallets JSONB,
    bnpl_accounts JSONB,
    payment_history JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 29. Mobile First Features Table
CREATE TABLE mobile_first_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    app_version VARCHAR(50),
    device_info JSONB,
    push_tokens JSONB,
    app_preferences JSONB,
    offline_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 30. Integration Ecosystem Table
CREATE TABLE integration_ecosystem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID,
    integration_name VARCHAR(200),
    integration_type VARCHAR(100),
    credentials JSONB,
    configuration JSONB,
    status VARCHAR(50) DEFAULT 'active',
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- LATEST 2024 FEATURES TABLES (6 NEW!)
-- =============================================================================

-- 31. Tabby Tamara Integration Table
CREATE TABLE tabby_tamara_integration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL,
    tabby_config JSONB,
    tamara_config JSONB,
    sessions JSONB,
    orders JSONB,
    analytics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 32. Enhanced Wallet Table
CREATE TABLE enhanced_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    balance JSONB NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    auto_reload JSONB,
    cashback JSONB,
    rewards JSONB,
    transactions JSONB,
    payment_methods JSONB,
    security JSONB,
    statistics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 33. Loyalty Punch Cards Table
CREATE TABLE loyalty_punch_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    active_punch_cards JSONB,
    completed_cards JSONB,
    history JSONB,
    statistics JSONB,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 34. Staff Work Tracking Table
CREATE TABLE staff_work_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
    work_sessions JSONB,
    jobs_assigned JSONB,
    current_activity JSONB,
    daily_metrics JSONB,
    weekly_metrics JSONB,
    monthly_metrics JSONB,
    productivity JSONB,
    rankings JSONB,
    goals JSONB,
    alerts JSONB,
    training JSONB,
    rewards JSONB,
    incidents JSONB,
    statistics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 35. Customer Retention Table
CREATE TABLE customer_retention (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    status JSONB,
    engagement JSONB,
    win_back_campaigns JSONB,
    retention_strategies JSONB,
    reengagement_actions JSONB,
    feedback JSONB,
    churn_indicators JSONB,
    loyalty_incentives JSONB,
    personalized_offers JSONB,
    milestones JSONB,
    metrics JSONB,
    automated_triggers JSONB,
    recovery_history JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 36. Automated Rewards Table
CREATE TABLE automated_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL,
    reward_programs JSONB,
    triggers JSONB,
    issued_rewards JSONB,
    birthday_rewards JSONB,
    anniversary_rewards JSONB,
    spending_milestones JSONB,
    frequency_rewards JSONB,
    referral_rewards JSONB,
    seasonal_campaigns JSONB,
    behavior_rewards JSONB,
    flash_rewards JSONB,
    surprise_rewards JSONB,
    analytics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Bookings indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);

-- Vehicles indexes
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

-- Financial transactions indexes
CREATE INDEX idx_financial_transactions_user_id ON financial_transactions(user_id);
CREATE INDEX idx_financial_transactions_booking_id ON financial_transactions(booking_id);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);

-- Reviews indexes
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Employees indexes
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_employee_number ON employees(employee_number);

-- Attendance indexes
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_punch_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_retention ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Vehicles policies
CREATE POLICY "Users can view own vehicles" ON vehicles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vehicles" ON vehicles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON vehicles
    FOR UPDATE USING (auth.uid() = user_id);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Users can view public reviews" ON reviews
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INITIAL DATA / SEED DATA
-- =============================================================================

-- Insert default admin user (password: admin123 - hashed)
-- Note: You'll need to hash the password properly in your application
INSERT INTO users (email, password_hash, role, first_name, last_name, is_verified, is_active)
VALUES
    ('admin@carwash.com', '$2b$10$placeholder_hash_change_this', 'admin', 'Admin', 'User', true, true),
    ('staff@carwash.com', '$2b$10$placeholder_hash_change_this', 'staff', 'Staff', 'User', true, true),
    ('customer@test.com', '$2b$10$placeholder_hash_change_this', 'customer', 'Test', 'Customer', true, true);

-- Insert default services
INSERT INTO services (name, description, category, base_price, duration_minutes, is_active)
VALUES
    ('Basic Wash', 'Exterior wash and dry', 'Basic', 50.00, 15, true),
    ('Premium Wash', 'Exterior wash, dry, and wax', 'Premium', 100.00, 30, true),
    ('Deluxe Wash', 'Full interior and exterior detail', 'Deluxe', 200.00, 60, true),
    ('Express Wash', 'Quick exterior wash', 'Express', 30.00, 10, true);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE users IS 'User accounts for customers, staff, and admins';
COMMENT ON TABLE bookings IS 'Car wash service bookings';
COMMENT ON TABLE tabby_tamara_integration IS 'MENA BNPL payment integration (Tabby & Tamara)';
COMMENT ON TABLE enhanced_wallets IS 'Digital wallet with 5% cashback and auto-reload';
COMMENT ON TABLE loyalty_punch_cards IS '5 washes = 1 free punch card system';
COMMENT ON TABLE staff_work_tracking IS 'Real-time staff GPS tracking and productivity';
COMMENT ON TABLE customer_retention IS 'AI-powered churn prediction and win-back';
COMMENT ON TABLE automated_rewards IS 'Automated rewards issuance engine';

-- =============================================================================
-- SCHEMA VERSION
-- =============================================================================

CREATE TABLE schema_version (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('2.0.0', 'Complete Supabase schema with all 36 tables including 6 new 2024 models');

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

-- Grant permissions (Supabase handles most of this automatically)
-- These are examples - adjust based on your needs

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
