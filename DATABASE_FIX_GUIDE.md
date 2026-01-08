# Database Fix Guide - total_price Column Error

## Problem
You're getting this error:
```
Error fetching bookings: {
  code: '42703',
  message: 'column bookings.total_price does not exist'
}
```

## Cause
The database schema has a column named `total_amount` but the API code expects `total_price`.

## Quick Fix (2 minutes)

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Open your "In and Out Car Wash" project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Fix**
   - Open the file: `FIX_TOTAL_PRICE.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - You should see: "✓ Successfully renamed total_amount to total_price"

4. **Verify the Fix**
   - The query results should show a column named `total_price` with type `numeric`

5. **Restart Your Server**
   - Run `stop.bat`
   - Run `start.bat`
   - The error should be gone!

### Option 2: Using the Batch File

Simply run:
```bash
fix-database.bat
```

This will open the SQL file and guide you through the process.

## What This Does

The fix runs this SQL command:

```sql
ALTER TABLE bookings RENAME COLUMN total_amount TO total_price;
```

This renames the column to match what your API code expects.

## Verification

After applying the fix, you can verify it worked by:

1. **Check in Supabase**
   - Go to "Table Editor" → "bookings"
   - You should see a column named `total_price` (not `total_amount`)

2. **Test the API**
   - Visit your admin dashboard
   - Go to Bookings Management
   - The error should be gone and bookings should load

## Files Updated

- ✅ `FIX_TOTAL_PRICE.sql` - The SQL fix to run in Supabase
- ✅ `fix-database.bat` - Helper script to guide you
- ✅ `apps/api/database/schema.sql` - Updated to prevent future issues
- ✅ `apps/api/database/migrations/002_fix_total_price_column.sql` - Migration file for reference

## Still Having Issues?

If you still see the error after applying the fix:

1. Make sure you clicked "Run" in Supabase SQL Editor
2. Check that you see the success message
3. Restart your API server completely
4. Clear your browser cache
5. Check the Supabase logs for any errors

## Prevention

The base schema file has been updated to use `total_price` from the start, so this won't happen if you recreate the database in the future.
