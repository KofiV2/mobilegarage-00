# Fix Login Issue - Quick Guide

## Problem
The default login credentials aren't working because the passwords in the database are placeholder hashes, not real ones.

## Solution (2 Options)

### Option 1: Update Passwords in Supabase (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Open your project: **gyvyoejlbbnxujcaygyr**

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Update Script**
   - Open the file: `apps/api/database/update-passwords.sql`
   - Copy ALL the content
   - Paste into Supabase SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify**
   - You should see 3 users returned at the bottom
   - The passwords are now properly hashed

5. **Try Logging In**
   - Admin: admin@carwash.com / admin123
   - Staff: staff@carwash.com / staff123
   - Customer: customer@test.com / customer123

### Option 2: Run Node Script (If Supabase is accessible)

1. **Run the hash script**
   ```bash
   cd apps/api
   node hash-passwords.js
   ```

2. **If it works**, you'll see:
   ```
   ✅ Updated Admin: admin@carwash.com
   ✅ Updated Staff: staff@carwash.com
   ✅ Updated Customer: customer@test.com
   ```

3. **If it fails** with "Tenant or user not found":
   - Use Option 1 instead (Supabase SQL Editor)

## Current Password Hashes

If you need to manually update them:

- **Admin (admin123):**
  ```
  $2b$10$UPP1w5leNC7jp1XoLiincu/lFtQMneAgeO.Kuhtp8uM5le60hTGVu
  ```

- **Staff (staff123):**
  ```
  $2b$10$FvZWfvYdzowkvQVXqOzs7enRq91JKcaLgd2wap3EV28mJ4RWSgisG
  ```

- **Customer (customer123):**
  ```
  $2b$10$2NHl1HKNSNNkGqkcvLHbyellhyz1EBHUyM.iyjS/IFB8ngqCrRIgC
  ```

## Verify Setup

After updating passwords, check in Supabase:

1. Go to **Table Editor**
2. Click on **users** table
3. You should see 3 users with proper password_hash values (not the placeholder)

## Test Login

Once updated, test the login on your application:

- **Web App:** http://localhost:5173
- **API:** http://localhost:3000/api/auth/login

Use these credentials:
- **Email:** admin@carwash.com
- **Password:** admin123

## Still Not Working?

Check these:

1. **Schema was run?**
   - Go to Supabase > Table Editor
   - You should see 36 tables
   - If not, run `schema.sql` first

2. **Users exist?**
   - Go to Table Editor > users
   - Should see 3 users (admin, staff, customer)

3. **Password hashes updated?**
   - Check if password_hash column has long hash (starts with `$2b$10$`)
   - NOT the placeholder (`$2b$10$placeholder_hash_change_this`)

4. **API is running?**
   - Check the API console window
   - Should say "Server running on port 3000"
   - Should say "Connected to Supabase"

## Quick Fix Command

If you just want to copy-paste in Supabase SQL Editor:

```sql
UPDATE users SET password_hash = '$2b$10$UPP1w5leNC7jp1XoLiincu/lFtQMneAgeO.Kuhtp8uM5le60hTGVu' WHERE email = 'admin@carwash.com';
UPDATE users SET password_hash = '$2b$10$FvZWfvYdzowkvQVXqOzs7enRq91JKcaLgd2wap3EV28mJ4RWSgisG' WHERE email = 'staff@carwash.com';
UPDATE users SET password_hash = '$2b$10$2NHl1HKNSNNkGqkcvLHbyellhyz1EBHUyM.iyjS/IFB8ngqCrRIgC' WHERE email = 'customer@test.com';
```

That's it! Your logins should work now. 🎉
