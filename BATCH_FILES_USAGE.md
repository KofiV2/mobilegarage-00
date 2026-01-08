# 🎯 Batch Files Usage Guide

## 📂 Available Batch Files

### 1. **restart-fresh.bat** ⭐ (RECOMMENDED)
**What it does**: Kills all processes and starts fresh with both servers

**Use when**:
- First time starting the system
- Things are not working and you want a clean start
- Ports are occupied and you want to fix everything

**How to use**:
```bash
# Just double-click the file or run:
restart-fresh.bat
```

**What happens**:
1. ✓ Kills all Node.js processes
2. ✓ Kills processes on ports 3000, 5173, 5174
3. ✓ Verifies ports are free
4. ✓ Starts backend on port 3000
5. ✓ Starts frontend on port 5173
6. ✓ Opens two terminal windows for monitoring

---

### 2. **kill-ports.bat**
**What it does**: Only kills processes on ports, doesn't restart

**Use when**:
- You want to manually start servers after
- You want to check if ports are free
- You need to stop everything quickly

**How to use**:
```bash
kill-ports.bat
```

**What happens**:
1. ✓ Kills processes on ports 3000, 5173, 5174, 5175
2. ✓ Kills all Node.js processes
3. ✓ Shows status of each port
4. ℹ️ Does NOT restart servers

---

### 3. **kill-and-restart.bat**
**What it does**: Kills processes and restarts (simpler version of restart-fresh.bat)

**Use when**:
- Quick restart needed
- Similar to restart-fresh but less verbose

**How to use**:
```bash
kill-and-restart.bat
```

---

## 🔥 Common Issues & Solutions

### Issue 1: "Port already in use"

**Error message**:
```
EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Option 1: Use restart-fresh.bat (recommended)
restart-fresh.bat

# Option 2: Kill ports manually then start
kill-ports.bat
# Then start manually:
cd apps/api && npm start
cd apps/web && npm run dev
```

---

### Issue 2: "Can't kill processes"

**Symptoms**:
- Batch file runs but ports still occupied
- Servers won't start

**Solution**:
```bash
# Run as Administrator
Right-click restart-fresh.bat → "Run as administrator"
```

---

### Issue 3: "Multiple terminal windows"

**Symptoms**:
- Too many command windows open
- Don't know which is which

**Solution**:
```bash
# The batch files name the windows:
# - "🚀 CarWash Backend (Port 3000)"
# - "🌐 CarWash Frontend (Vite)"

# To close all at once, use kill-ports.bat
kill-ports.bat
```

---

## 📊 Quick Reference Table

| Batch File | Kills Processes | Starts Backend | Starts Frontend | Verbose Output |
|-----------|----------------|----------------|-----------------|----------------|
| **restart-fresh.bat** | ✅ | ✅ | ✅ | ✅ |
| **kill-and-restart.bat** | ✅ | ✅ | ✅ | ⚠️ Medium |
| **kill-ports.bat** | ✅ | ❌ | ❌ | ✅ |

---

## 🎯 Recommended Workflow

### **For Daily Development:**
```bash
# Morning: Start fresh
restart-fresh.bat

# Work on your code...

# End of day: Clean shutdown
kill-ports.bat
```

---

### **When Things Break:**
```bash
# Nuclear option: Kill everything and restart
restart-fresh.bat
```

---

### **For Testing:**
```bash
# Kill servers
kill-ports.bat

# Start manually to see logs clearly
cd apps/api
npm start

# In another terminal
cd apps/web
npm run dev
```

---

## 🆘 Troubleshooting

### Problem: "Batch file does nothing"

**Possible causes**:
- Running from wrong directory
- Missing permissions

**Solution**:
```bash
# Make sure you're in the project root
cd C:\Users\PC\Desktop\claude\carwash-00

# Run as administrator
Right-click → "Run as administrator"
```

---

### Problem: "Backend starts but frontend fails"

**Solution**:
```bash
# Start backend first
cd apps/api
npm start

# Wait 5 seconds, then start frontend
cd apps/web
npm run dev
```

---

### Problem: "Can't find npm"

**Error message**:
```
'npm' is not recognized as an internal or external command
```

**Solution**:
```bash
# Install Node.js from https://nodejs.org
# Or add Node to PATH

# Verify installation:
node --version
npm --version
```

---

## 📝 What Each Port Does

| Port | Service | URL | Purpose |
|------|---------|-----|---------|
| **3000** | Backend API | http://localhost:3000 | REST API, Database |
| **5173** | Frontend | http://localhost:5173 | React app (Vite) |
| **5174** | Frontend Alt | http://localhost:5174 | If 5173 is busy |

---

## 💡 Pro Tips

1. **Always use restart-fresh.bat when in doubt**
   - It's the most reliable way to start

2. **Keep terminal windows open**
   - You can see real-time logs
   - Easy to spot errors

3. **If one batch file fails, try another**
   - They all achieve similar results
   - Some are more aggressive than others

4. **Check credentials.txt for login info**
   - admin@test.com / admin123
   - staff@test.com / staff123
   - customer@test.com / customer123

5. **Use Task Manager as backup**
   - Press Ctrl+Shift+Esc
   - Find "Node.js" processes
   - End task manually if needed

---

## 🔧 Manual Port Killing (Advanced)

If batch files don't work, use these manual commands:

```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill specific PID (replace 12345 with actual PID)
taskkill /F /PID 12345

# Kill all Node processes (nuclear option)
taskkill /F /IM node.exe

# Verify ports are free
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

---

## ✅ Success Checklist

After running restart-fresh.bat, verify:

- [ ] Two terminal windows opened (Backend + Frontend)
- [ ] Backend shows: "Server running on http://localhost:3000"
- [ ] Frontend shows: "Local: http://localhost:5173"
- [ ] Can open http://localhost:5173 in browser
- [ ] Can login with test credentials
- [ ] No error messages in terminals

---

## 🎊 You're All Set!

Now you can use these batch files to manage your servers easily:

- **Daily work**: `restart-fresh.bat`
- **Quick kill**: `kill-ports.bat`
- **Clean restart**: `restart-fresh.bat` (always works!)

---

**Need more help?** Check these files:
- `credentials.txt` - Login credentials
- `QUICK_FIX_USERS_PAGE.md` - Debugging guide
- `DEBUG_USERS_PAGE.md` - Detailed troubleshooting
