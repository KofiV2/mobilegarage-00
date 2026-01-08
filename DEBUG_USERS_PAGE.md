# 🔍 Debug: Users Management Page Not Showing Users

**Issue**: Users Management page is not displaying any user details

---

## 🧪 Quick Tests

### 1. **Check if Backend is Running**

Open browser and go to:
```
http://localhost:3000/health
```

Should see: `{"status":"ok"}` or similar

---

### 2. **Check Browser Console for Errors**

1. Open Users Management page: `http://localhost:5173/admin/users`
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for any errors (red text)

**Common Errors:**
- `401 Unauthorized` - Not logged in or token expired
- `403 Forbidden` - User is not admin
- `Failed to fetch` - Backend not running
- Network error - CORS issue

---

### 3. **Check Network Tab**

1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Refresh the page
4. Look for request to `/api/admin/users`

**Click on the request and check:**
- **Status**: Should be `200 OK`
- **Response**: Should show users array with pagination
- **Headers**: Check if `Authorization` header is present

---

### 4. **Test API Directly**

Open a new browser tab and test the API:

```bash
# Get your auth token from localStorage
# Press F12 → Console → Type:
localStorage.getItem('token')
```

Then test with curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/api/admin/users
```

**Expected Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "admin@example.com",
      "first_name": "John",
      "last_name": "Doe",
      ...
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 50,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## 🐛 Common Issues & Fixes

### **Issue 1: Not Logged In**

**Symptom**: Page redirects to login or shows blank

**Fix**:
1. Go to: `http://localhost:5173/login`
2. Login with admin credentials
3. Try accessing `/admin/users` again

---

### **Issue 2: Not Admin User**

**Symptom**: 403 Forbidden error or redirect to home

**Fix**: Make sure your user has `role = 'admin'` in database

**Check user role in database:**
```sql
-- In Supabase SQL Editor
SELECT id, email, role FROM users WHERE email = 'your@email.com';
```

**Update to admin if needed:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

### **Issue 3: No Users in Database**

**Symptom**: Page loads but table is empty, says "Showing 0 of 0"

**Fix**: You need to create test users

**Quick way to check:**
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM users;
```

If count is 0, create test users via:
- Register page: `http://localhost:5173/register`
- Or insert directly in Supabase

---

### **Issue 4: Token Expired**

**Symptom**: Was working before, now shows 401 Unauthorized

**Fix**:
1. Logout and login again
2. Or clear localStorage and login:
   - Press `F12` → Console
   - Type: `localStorage.clear()`
   - Refresh page and login again

---

### **Issue 5: CORS Error**

**Symptom**: Console shows CORS policy error

**Fix**: Check API URL in frontend

**File**: `apps/web/src/services/api.js` or `.env`

Should be:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

Or in `.env`:
```
VITE_API_URL=http://localhost:3000
```

---

### **Issue 6: Wrong API URL**

**Symptom**: Network tab shows request to wrong URL

**Fix**:

1. Check `.env` file in `apps/web/`:
```bash
VITE_API_URL=http://localhost:3000
```

2. Restart frontend after changing `.env`:
```bash
cd apps/web
npm run dev
```

---

## 🔧 Manual Test Steps

### Step 1: Verify Backend is Working

```bash
cd apps/api
npm start
```

Should see:
```
✅ Server running on http://localhost:3000
✅ Connected to database
```

---

### Step 2: Verify Frontend is Working

```bash
cd apps/web
npm run dev
```

Should see:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 3: Test Login Flow

1. Go to: `http://localhost:5173/login`
2. Login with credentials
3. Should redirect to `/dashboard`
4. Check localStorage has token:
   - Press `F12` → Console
   - Type: `localStorage.getItem('token')`
   - Should show JWT token string

---

### Step 4: Test Admin Access

1. Go to: `http://localhost:5173/admin/users`
2. Should see Users Management page
3. If redirected to home, you're not admin

---

### Step 5: Check API Response

Press `F12` → Network tab → Look for `/api/admin/users` request

**If Status 200 but no users showing:**
- Check Response tab: Should show `{"users": [...], "pagination": {...}}`
- Check if `users` array is empty: `{"users": [], "pagination": {"total": 0}}`
  - This means no users in database

**If Status 401:**
- Token is invalid or expired
- Logout and login again

**If Status 403:**
- User is not admin
- Update user role in database

**If Status 500:**
- Backend error
- Check backend console for error message

---

## 📊 Expected Behavior

### **When Working Correctly:**

1. Page loads with loading spinner
2. API call to `/api/admin/users?page=1&limit=50`
3. Response received with users array
4. Table populates with user data
5. Pagination shows "Showing 1-50 of X users"
6. Can click page numbers to navigate

### **Visual Indicators:**

- **Loading**: Shows `LoadingSpinner` component
- **No users**: Empty table with message
- **Has users**: Table with rows, pagination controls

---

## 🆘 Still Not Working?

### **Debug Checklist:**

- [ ] Backend is running on http://localhost:3000
- [ ] Frontend is running on http://localhost:5173
- [ ] Logged in as admin user
- [ ] Token exists in localStorage
- [ ] Network request to `/api/admin/users` returns 200
- [ ] Response contains users array
- [ ] Browser console has no errors

### **If All Above Pass But Still No Users:**

Check the frontend state in React DevTools:

1. Install React DevTools extension
2. Open DevTools → Components tab
3. Find `UsersManagement` component
4. Check state:
   - `loading`: should be `false`
   - `users`: should be array with data
   - `totalItems`: should be > 0

### **Quick Console Test:**

In browser console, check the fetch directly:

```javascript
// Get token
const token = localStorage.getItem('token');

// Test fetch
fetch('http://localhost:3000/api/admin/users?page=1&limit=50', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Users data:', data))
.catch(err => console.error('Error:', err));
```

This will show exactly what the API is returning!

---

## 💡 Most Likely Issues

Based on the symptoms, here are the most common causes:

1. **No users in database** (80% of cases)
   - Solution: Register users or insert test data

2. **Not logged in as admin** (15% of cases)
   - Solution: Update user role to 'admin' in database

3. **Backend not running** (5% of cases)
   - Solution: Start backend with `cd apps/api && npm start`

---

## 🚀 Quick Fix Script

Try this in backend console to create test admin user:

```javascript
// In apps/api directory, create test-admin.js:

const { supabaseAdmin } = require('./src/config/supabase');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: 'admin@test.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      is_verified: true
    })
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Admin user created:', data);
    console.log('Login with: admin@test.com / admin123');
  }
}

createAdminUser();
```

Run it:
```bash
node test-admin.js
```

---

**After following this guide, the Users Management page should display users correctly!**
