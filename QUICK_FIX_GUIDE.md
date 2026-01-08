# 🚀 Quick Fix Guide - Get Running in 5 Minutes

## The Fastest Way to Fix All Issues

### Step 1: Fix Database (2 minutes)
```bash
# Option A: Use the batch file
fix-database.bat

# Option B: Manual (copy this SQL and run in Supabase SQL Editor)
ALTER TABLE bookings RENAME COLUMN total_amount TO total_price;
```

### Step 2: Restart Servers (1 minute)
```bash
stop.bat
start.bat
```

### Step 3: Test (2 minutes)
1. Open `http://localhost:5173`
2. Login as admin
3. Check dashboard loads
4. Verify no errors in console

---

## 🌐 Enable Network Access (Optional)

If you want to access from other devices (phone, tablet, etc.):

### Quick Setup:
```bash
# 1. Find your IP
ipconfig

# Look for "IPv4 Address" - Example: 192.168.1.100

# 2. Create .env file
cd apps\web
copy .env.example .env

# 3. Edit .env and change:
VITE_API_URL=http://192.168.1.100:3000/api
#              ^^^^^^^^^^^^^^^^^^^^
#              Use YOUR IP here

# 4. Restart
cd ..\..
stop.bat
start.bat
```

### Access From Other Devices:
```
Open browser on phone/tablet:
http://192.168.1.100:5173
    ^^^^^^^^^^^^^^^^^^^^
    Use YOUR IP here
```

---

## 🐛 Still Having Issues?

### Problem: "Cannot reach server"
**Solution:** Make sure API server is running
```bash
# Check if ports are in use
netstat -an | findstr ":3000"
netstat -an | findstr ":5173"

# Should show LISTENING on both ports
```

### Problem: "total_price does not exist"
**Solution:** Database fix not applied
```bash
# Run the SQL in Supabase Dashboard
# See FIX_TOTAL_PRICE.sql for the exact SQL
```

### Problem: "Translation keys showing"
**Solution:** Browser cache
```bash
# Clear browser cache or hard refresh
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)
```

### Problem: "Can't access from phone"
**Solution:** Check firewall
```bash
# Windows Firewall might be blocking port 5173
# Add exception in Windows Firewall settings
# OR temporarily disable Windows Firewall to test
```

---

## ✅ Success Indicators

You'll know everything works when:
- ✅ Dashboard shows numbers (not zeros)
- ✅ No red errors in browser console (F12)
- ✅ All text is in proper language (not "admin.something")
- ✅ Loading spinners show briefly then disappear
- ✅ Can navigate between admin and customer pages

---

## 📞 Need More Help?

See detailed documentation:
- `FIXES_SUMMARY_2024-12-31.md` - Complete list of all fixes
- `DATABASE_FIX_GUIDE.md` - Database issues
- `SUPABASE_SETUP_GUIDE.md` - Initial setup

---

**That's it! You should be up and running now! 🎉**
