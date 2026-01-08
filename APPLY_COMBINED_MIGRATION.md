# 🚀 Apply Combined Migration - Fix Everything!

**One migration to fix both schema AND security issues!**

---

## 🎯 What This Fixes

This single migration fixes **BOTH issues**:

1. ✅ **Missing tables** (analytics_snapshots, notifications)
2. ✅ **All 33 security warnings** (RLS on all tables)
3. ✅ **Missing fields** (total_bookings, total_revenue, queue_position)
4. ✅ **Auto-update triggers** (counters update automatically)
5. ✅ **Security policies** (role-based access control)

---

## ⚡ Quick Apply (2 Minutes)

### Step 1: Copy Migration

**Windows:**
```bash
# Just double-click this file:
copy-combined-migration.bat
```

**Mac/Linux:**
```bash
cat apps/api/database/migrations/008_combined_schema_and_rls.sql | pbcopy
```

### Step 2: Apply in Supabase

1. **Go to**: https://supabase.com/dashboard
2. **Select** your project
3. **Click**: SQL Editor (left sidebar)
4. **Click**: "New Query"
5. **Press**: Ctrl+V (paste the migration)
6. **Click**: "Run" button (or press F5)

### Step 3: Wait

⏱️ **Takes 10-30 seconds** - you'll see progress messages

### Step 4: Verify Success

You should see output like:
```
NOTICE: Combined Migration Complete!
NOTICE: ✓ Users.total_bookings counter added
NOTICE: ✓ Services counters added
NOTICE: ✓ Notifications table created
NOTICE: ✓ Tables with RLS enabled: 36
NOTICE: ✓ Security policies created: 50+
NOTICE: Schema version updated to 2.4.0
```

✅ **Done!**

---

## 🔍 Verify It Worked

### Check 1: Schema Version

In Supabase SQL Editor:
```sql
SELECT version, description, applied_at
FROM schema_version
ORDER BY applied_at DESC
LIMIT 1;
```

Should show: **Version 2.4.0**

### Check 2: Tables Exist

```sql
-- Check notifications table
SELECT COUNT(*) FROM notifications;
-- Should return: 0 (table exists, just empty)

-- Check analytics_snapshots table
SELECT COUNT(*) FROM analytics_snapshots;
-- Should return: 0 (table exists, just empty)
```

### Check 3: RLS Enabled

**Supabase Dashboard:**
1. Go to: **Database** → **Replication**
2. Click: **Row Level Security** tab
3. See: All tables showing "RLS Enabled ✓"

### Check 4: Security Warnings Gone

**Supabase Dashboard:**
1. Go to: **Advisors** (left sidebar)
2. Click: **Security** tab
3. See: **Zero "RLS Disabled" warnings**

---

## 📊 What Gets Created

### New Tables
- ✅ `notifications` - Complete notification system
- ✅ `analytics_snapshots` - Dashboard stats cache

### New Columns
- ✅ `users.total_bookings` - Auto-updated counter
- ✅ `services.total_bookings` - Auto-updated counter
- ✅ `services.total_revenue` - Auto-updated revenue tracker
- ✅ `bookings.queue_position` - Queue management

### Auto-Update Triggers
- ✅ Booking created → User's `total_bookings` increments
- ✅ Booking created → Service's `total_bookings` increments
- ✅ Booking completed → Service's `total_revenue` updates

### Security Policies (50+)
- ✅ **Users**: Can only see their own profile
- ✅ **Bookings**: Customers see own, staff see all
- ✅ **Services**: Public can view active services
- ✅ **Notifications**: Users only see their own
- ✅ **Admin tables**: Admin-only access
- ✅ **And 45+ more policies...**

### Helper Functions
```sql
is_admin()  -- Returns TRUE if user is admin
is_staff()  -- Returns TRUE if user is staff/admin
```

---

## 🧪 Test After Migration

### Test 1: Create a Booking

```sql
-- This should auto-increment counters
INSERT INTO bookings (
    user_id, service_id, vehicle_id,
    booking_number, scheduled_date, total_price, status
) VALUES (
    'user-uuid', 'service-uuid', 'vehicle-uuid',
    'TEST-001', NOW() + INTERVAL '1 day', 100.00, 'pending'
);

-- Check counters updated
SELECT total_bookings FROM users WHERE id = 'user-uuid';
-- Should have incremented by 1

SELECT total_bookings, total_revenue FROM services WHERE id = 'service-uuid';
-- Should have incremented
```

### Test 2: RLS Policies

```javascript
// In your frontend (with Supabase client)

// Customer tries to see all users
const { data } = await supabase.from('users').select('*');
// Should only return THEIR profile

// Customer tries to see all bookings
const { data } = await supabase.from('bookings').select('*');
// Should only return THEIR bookings
```

---

## ✅ Checklist

After applying the migration:

- [ ] Run the migration in Supabase SQL Editor
- [ ] See success messages (no errors)
- [ ] Verify schema version = 2.4.0
- [ ] Check notifications table exists
- [ ] Check analytics_snapshots table exists
- [ ] Verify RLS enabled on all tables
- [ ] Check security warnings are gone (Advisors → Security)
- [ ] Test creating a booking (counters should update)
- [ ] Test RLS with different user roles

---

## 🆘 Troubleshooting

### Error: "relation X already exists"

**Solution:** This is fine! The migration uses `IF NOT EXISTS`, so it skips existing objects.

### Error: "duplicate key value violates unique constraint"

**Solution:** You may have run the migration twice. Check schema_version:
```sql
SELECT * FROM schema_version ORDER BY applied_at DESC;
```

If 2.4.0 is there, you're good!

### Still seeing security warnings

**Solution:**
1. Refresh Supabase Dashboard (Ctrl+F5)
2. Wait 1-2 minutes for cache to clear
3. Check Advisors → Security again

### Counters not updating

**Solution:** Check if triggers exist:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%booking%';
```

Should show:
- `trigger_update_user_booking_count`
- `trigger_update_service_stats`

---

## 🎊 Success Indicators

You'll know it worked when:

✅ **No errors** during migration execution
✅ **Schema version** shows 2.4.0
✅ **Notifications table** exists and queryable
✅ **All tables** show "RLS Enabled ✓" in dashboard
✅ **Zero security warnings** in Advisors
✅ **Counters** auto-increment when creating bookings
✅ **RLS policies** block unauthorized access

---

## 📚 What You Get

### Database Features
- ✅ **36 tables** fully secured with RLS
- ✅ **Auto-tracking** for user/service stats
- ✅ **Notification system** ready to use
- ✅ **Analytics cache** for fast dashboards
- ✅ **Queue management** for bookings

### Security
- ✅ **Role-based access** (Customer/Staff/Admin/Public)
- ✅ **Row-level filtering** automatic
- ✅ **Production-ready** security posture
- ✅ **Compliance** with best practices

### Performance
- ✅ **Auto-update triggers** (no manual counting)
- ✅ **Optimized indexes** for fast queries
- ✅ **Materialized views** for dashboard
- ✅ **Efficient RLS** policies

---

## 🚀 Next Steps

After migration success:

1. **Test your app** - Create test bookings, users
2. **Verify counters** - Check totals update automatically
3. **Test RLS** - Try accessing data with different roles
4. **Deploy confidence** - Your database is production-ready!

---

## 💡 Pro Tips

### Backend API

Your API with **service role key** bypasses RLS:
```javascript
// Admin operations - bypasses RLS
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

### Client Apps

Client with **anon key** respects RLS:
```javascript
// User operations - respects RLS
const supabase = createClient(url, ANON_KEY);
```

### Future Policies

Use helper functions when adding new tables:
```sql
CREATE POLICY "new_table_policy" ON new_table
    FOR SELECT
    USING (is_admin() OR auth.uid() = user_id);
```

---

**Ready? Double-click `copy-combined-migration.bat` and paste into Supabase!** 🚀
