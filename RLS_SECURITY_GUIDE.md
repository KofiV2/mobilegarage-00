# 🔒 Row Level Security (RLS) Implementation Guide

**Fix Supabase Security Warnings - Complete Guide**

**Migration Version**: 2.3.0
**Date**: 2026-01-07
**Status**: ✅ Ready to Apply

---

## 🚨 The Problem

Supabase is showing security warnings like:

```
⚠️  RLS Disabled in Public

Entity: public.services
Issue: Table public.services is public, but RLS has not been enabled.

(and 32 other similar warnings)
```

**Why this matters:**
- Without RLS, anyone with your database URL can access ALL data
- Customer data, admin data, financial data - everything is exposed
- This is a **critical security vulnerability** in production

---

## ✅ The Solution

We've created a comprehensive RLS migration that:

1. ✅ Enables RLS on all 36 tables
2. ✅ Creates 90+ security policies
3. ✅ Implements role-based access control (RBAC)
4. ✅ Provides helper functions for easy policy management
5. ✅ Fixes ALL Supabase security warnings

---

## 🚀 Quick Apply (1 Minute)

### Option 1: Node.js Script (Recommended)

```bash
cd apps/api
node apply-rls-security.js
```

### Option 2: Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `apps/api/database/migrations/007_enable_row_level_security.sql`
3. Paste and Run

---

## 🔐 Security Model Implemented

### Role-Based Access Control

| Role | Access Level | Example |
|------|-------------|---------|
| **Customer** | Own data only | Can see their bookings, vehicles, wallet |
| **Staff** | Work-related data | Can see all bookings, customer info for service |
| **Admin** | Full access | Can manage everything |
| **Public** | Very limited | Can view active services, public reviews |

---

## 📋 Detailed Policies by Table

### Core Business Tables

#### 1. Users Table

**Policies:**
- ✅ Users can view/update their own profile
- ✅ Users can create their own account (signup)
- ✅ Staff can view customer profiles (for bookings)
- ✅ Admins can view/update/delete all users

**Example:**
```sql
-- Customer tries to view another user's profile
SELECT * FROM users WHERE id = 'other-user-id';
-- ❌ Returns empty (RLS blocks it)

-- Customer views their own profile
SELECT * FROM users WHERE id = auth.uid();
-- ✅ Returns their data
```

#### 2. Services Table

**Policies:**
- ✅ Everyone (including public) can view active services
- ✅ Staff can view all services (including inactive)
- ✅ Only admins can create/update/delete services

**Why:** Services are like a product catalog - should be publicly viewable

#### 3. Bookings Table

**Policies:**
- ✅ Customers can view/create their own bookings
- ✅ Customers can update their pending bookings (cancel, reschedule)
- ✅ Staff can view/update all bookings
- ✅ Admins have full access

**Example:**
```sql
-- Customer tries to view all bookings
SELECT * FROM bookings;
-- ✅ Returns only THEIR bookings (RLS filters automatically)

-- Staff views all bookings
SELECT * FROM bookings;
-- ✅ Returns ALL bookings (staff policy allows it)
```

#### 4. Vehicles Table

**Policies:**
- ✅ Customers can manage (CRUD) their own vehicles
- ✅ Staff can view all vehicles (for service)
- ✅ Admins have full access

#### 5. Reviews Table

**Policies:**
- ✅ Everyone can view public reviews
- ✅ Customers can create reviews for their completed bookings
- ✅ Customers can update/delete their own reviews
- ✅ Staff can view all reviews
- ✅ Admins can respond to reviews

---

### Internal Management Tables

#### Employees Table
- ✅ Employees can view their own record
- ✅ Staff can view all employees
- ✅ Admins manage everything

#### Attendance Table
- ✅ Employees can check-in/check-out (insert/update)
- ✅ Employees can view their own attendance
- ✅ Staff can view all attendance
- ✅ Admins manage everything

#### Payroll Table
- ✅ Employees can view their own payroll
- ✅ **Only admins** can manage payroll (sensitive!)

#### Inventory, Fleet, Financial Transactions
- ✅ Staff can view
- ✅ Admins can manage

---

### Customer Engagement Tables

#### Loyalty Programs, Wallets, Subscriptions
- ✅ Customers can view/manage their own
- ✅ Staff can view (for support)
- ✅ Admins have full access

#### Vehicle Care History
- ✅ Customers can view their vehicle's service history
- ✅ Staff can view/create records
- ✅ Admins manage everything

---

### AI & Advanced Features

#### AI Assistants, Gamification, Environmental Tracking, etc.
- ✅ Users can only access their own data
- ✅ These are personal to each user

#### Social Feeds
- ✅ Everyone can view public posts
- ✅ Users can manage their own posts
- ✅ Admins can moderate

---

### Admin-Only Tables

These tables are **admin-only** for security:
- ✅ Advanced Analytics
- ✅ Enterprise Features
- ✅ Marketing Automation
- ✅ Integration Ecosystem
- ✅ IoT Devices
- ✅ Automated Rewards
- ✅ Tabby/Tamara Integration

---

## 🛠️ Helper Functions

Four helper functions make policies easier to write:

### 1. `is_admin()`
```sql
-- Returns TRUE if current user is admin
SELECT is_admin();

-- Example policy
CREATE POLICY "admin_only" ON sensitive_table
    FOR ALL USING (is_admin());
```

### 2. `is_staff()`
```sql
-- Returns TRUE if current user is staff OR admin
SELECT is_staff();

-- Example policy
CREATE POLICY "staff_can_view" ON bookings
    FOR SELECT USING (is_staff());
```

### 3. `is_customer()`
```sql
-- Returns TRUE if current user is customer
SELECT is_customer();
```

### 4. `current_user_role()`
```sql
-- Returns the user's role as string
SELECT current_user_role();
-- Returns: 'customer', 'staff', or 'admin'
```

---

## 🧪 Testing RLS Policies

### Create Test Users

```sql
-- Create test users with different roles
INSERT INTO users (email, password_hash, role, first_name, last_name)
VALUES
  ('customer@test.com', '$2b$10$hashed', 'customer', 'Test', 'Customer'),
  ('staff@test.com', '$2b$10$hashed', 'staff', 'Test', 'Staff'),
  ('admin@test.com', '$2b$10$hashed', 'admin', 'Test', 'Admin');
```

### Test as Customer

```javascript
// In your frontend (using Supabase client)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'customer@test.com',
  password: 'password123'
});

// Try to view all bookings
const { data: bookings } = await supabase
  .from('bookings')
  .select('*');

// ✅ Should only return THEIR bookings
console.log('Customer bookings:', bookings);

// Try to view all users
const { data: users } = await supabase
  .from('users')
  .select('*');

// ✅ Should only return THEIR profile
console.log('Visible users:', users);
```

### Test as Staff

```javascript
// Sign in as staff
await supabase.auth.signInWithPassword({
  email: 'staff@test.com',
  password: 'password123'
});

// Try to view all bookings
const { data: bookings } = await supabase
  .from('bookings')
  .select('*');

// ✅ Should return ALL bookings
console.log('All bookings:', bookings);

// Try to delete a booking
const { error } = await supabase
  .from('bookings')
  .delete()
  .eq('id', 'booking-id');

// ❌ Should fail (only admins can delete)
console.log('Delete error:', error);
```

### Test as Admin

```javascript
// Sign in as admin
await supabase.auth.signInWithPassword({
  email: 'admin@test.com',
  password: 'password123'
});

// Admin can do ANYTHING
const { data: users } = await supabase.from('users').select('*');
const { data: bookings } = await supabase.from('bookings').select('*');
const { error } = await supabase.from('users').delete().eq('id', 'user-id');

// ✅ All operations succeed
```

---

## 🔧 Backend API Considerations

### Service Role Key Bypasses RLS

When your backend API uses the **service role key**, RLS is **bypassed**.

```javascript
// Using service role key (from .env)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️  Bypasses RLS!
);

// This returns ALL users (no RLS filtering)
const { data } = await supabase.from('users').select('*');
```

**When to use service role:**
- ✅ Admin operations in your API
- ✅ Background jobs/cron tasks
- ✅ System-level operations

**When to use anon key:**
- ✅ Client-side operations
- ✅ When you want RLS to be enforced

### Validate Permissions in API

Even though service role bypasses RLS, **still validate permissions** in your API:

```javascript
// apps/api/src/routes/admin/users.js
router.delete('/admin/users/:id', async (req, res) => {
  // Check if requester is admin
  const requester = await getUserFromToken(req.headers.authorization);

  if (requester.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Now delete (using service role)
  await supabase.from('users').delete().eq('id', req.params.id);

  res.json({ success: true });
});
```

---

## 📊 Verification Checklist

After applying the migration:

### 1. Check Supabase Dashboard

- [ ] Go to: Database → Replication → Row Level Security
- [ ] All tables should show "RLS Enabled" ✓
- [ ] Go to: Advisors → Security
- [ ] All "RLS Disabled" warnings should be gone

### 2. Check Policies

```sql
-- Count policies per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Should show ~2-5 policies per table
```

### 3. Test Authentication

```sql
-- Check helper functions work
SELECT is_admin();        -- Should return boolean
SELECT is_staff();        -- Should return boolean
SELECT current_user_role(); -- Should return role string
```

### 4. Verify Schema Version

```sql
SELECT version, description
FROM schema_version
ORDER BY applied_at DESC
LIMIT 1;

-- Should show version 2.3.0
```

---

## 🚨 Common Issues & Solutions

### Issue: "Permission denied for table X"

**Cause:** Client trying to access data they don't have permission for

**Solution:** This is working correctly! RLS is blocking unauthorized access.

**Fix in code:**
```javascript
// Don't try to fetch data the user shouldn't see
// BAD: Customer trying to get all users
const { data } = await supabase.from('users').select('*');

// GOOD: Customer gets their own profile
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single();
```

### Issue: "Function auth.uid() does not exist"

**Cause:** Trying to test RLS in wrong context

**Solution:** RLS uses `auth.uid()` which only works with Supabase auth context.

**Test properly:**
```javascript
// Use Supabase client (not raw SQL)
const supabase = createClient(url, anonKey);
await supabase.auth.signIn({ email, password });
// Now queries will use auth.uid()
```

### Issue: Backend API returns empty results

**Cause:** Using anon key instead of service role key

**Solution:**
```javascript
// For backend admin operations, use service role
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Not ANON_KEY
);
```

### Issue: "Infinite recursion detected"

**Cause:** Policy references itself

**Solution:** Our migration is designed to avoid this. If it happens, check for circular references in custom policies.

---

## 🔄 Rollback (If Needed)

If you need to rollback (not recommended):

```sql
-- Disable RLS on all tables (DANGEROUS!)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Drop all policies
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

-- Drop helper functions
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_staff();
DROP FUNCTION IF EXISTS is_customer();
DROP FUNCTION IF EXISTS current_user_role();

-- Revert schema version
DELETE FROM schema_version WHERE version = '2.3.0';
```

⚠️  **WARNING:** Only rollback if absolutely necessary. Without RLS, your database is vulnerable!

---

## 📚 Additional Resources

### Supabase RLS Documentation
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)

### PostgreSQL RLS Documentation
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## 🎯 Summary

### What This Migration Does

✅ **Enables RLS** on all 36 tables
✅ **Creates 90+ policies** for role-based access
✅ **Helper functions** for easy policy management
✅ **Fixes all Supabase security warnings**
✅ **Production-ready security** in one migration

### Security Levels

| Data Type | Customer | Staff | Admin | Public |
|-----------|----------|-------|-------|--------|
| Own profile | ✅ | ✅ | ✅ | ❌ |
| Own vehicles | ✅ | ✅ | ✅ | ❌ |
| Own bookings | ✅ | ✅ | ✅ | ❌ |
| All bookings | ❌ | ✅ | ✅ | ❌ |
| All users | ❌ | 👁️ View | ✅ | ❌ |
| Services | 👁️ View | ✅ | ✅ | 👁️ View |
| Payroll | Own only | ❌ | ✅ | ❌ |
| Analytics | ❌ | ❌ | ✅ | ❌ |

Legend: ✅ Full Access | 👁️ View Only | ❌ No Access

---

## ✅ Ready to Apply?

Run this command to fix all security warnings:

```bash
cd apps/api
node apply-rls-security.js
```

**Expected time:** 10-30 seconds
**Impact:** Zero downtime, no data changes
**Result:** All 33 security warnings fixed!

---

**Questions?** Check the troubleshooting section above or review the migration SQL file for detailed inline comments.

**Your database will be production-ready and secure!** 🔒🎉
