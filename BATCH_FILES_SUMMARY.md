# 🎯 Batch Files Quick Reference

## Complete list of all `.bat` files and their uses

---

## 📦 **install.bat**
**First time setup - Run this first!**

✅ Checks Node.js and npm
✅ Installs all dependencies (root, API, web, mobile)
✅ Optionally seeds database

```bash
# Double-click or run:
install.bat
```

---

## 🚀 **start.bat**
**Start all services - Main script!**

✅ Auto-kills port conflicts (3000, 5173, 19000, 19001)
✅ Checks and installs missing dependencies
✅ Starts API, Web, and Mobile in separate windows
✅ Shows URLs and login credentials

```bash
# Double-click or run:
start.bat
```

**Opens:**
- API Server (http://localhost:3000)
- Web App (http://localhost:5173)
- Mobile App (Expo DevTools)

---

## 🛑 **stop.bat**
**Stop all services**

✅ Kills all Node.js processes
✅ Frees ports 3000, 5173, 19000, 19001
✅ Cleans up temporary files

```bash
# Double-click or run:
stop.bat
```

---

## 🔄 **restart.bat**
**Restart everything quickly**

✅ Stops all services
✅ Waits 2 seconds
✅ Starts everything again

```bash
# Double-click or run:
restart.bat
```

---

## 📊 **status.bat**
**Check system status**

✅ Shows Node.js/npm/MongoDB versions
✅ Lists running services with PIDs
✅ Checks dependency installation
✅ Displays all URLs

```bash
# Double-click or run:
status.bat
```

**Example Output:**
```
[System Requirements]
[OK] Node.js: Installed - v18.17.0
[OK] npm: Installed - 9.8.1

[Port Status]
[RUNNING] Port 3000: API Server (PID: 12345)
[RUNNING] Port 5173: Web App (PID: 67890)
[STOPPED] Port 19000: Expo DevTools
```

---

## 📝 **logs.bat**
**View application logs**

✅ View API logs
✅ View Web logs
✅ View Mobile logs
✅ View all logs combined
✅ Clear all logs

```bash
# Double-click or run:
logs.bat
```

---

## 🎯 Quick Workflow

### **First Time:**
```
1. install.bat
2. start.bat
3. Open http://localhost:5173
```

### **Daily Use:**
```
1. start.bat     → Start working
2. [code...]     → Make changes
3. restart.bat   → See changes
4. stop.bat      → End of day
```

### **Debugging:**
```
1. status.bat    → See what's running
2. logs.bat      → Check errors
3. stop.bat      → Stop everything
4. start.bat     → Fresh start
```

---

## 🔑 Default Credentials

**After seeding database:**

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@carwash.com      | admin123     |
| Staff    | staff@carwash.com      | staff123     |
| Customer | customer@test.com      | customer123  |

---

## 🌐 URLs

| Service | URL                          | Port  |
|---------|------------------------------|-------|
| API     | http://localhost:3000        | 3000  |
| Web     | http://localhost:5173        | 5173  |
| Expo    | http://localhost:19000       | 19000 |
| Metro   | http://localhost:19001       | 19001 |

---

## ⚠️ Troubleshooting

### Port already in use?
```bash
stop.bat    # Kills all processes
start.bat   # Starts fresh
```

### Dependencies missing?
```bash
install.bat  # Reinstalls everything
```

### Services not responding?
```bash
restart.bat  # Quick restart
```

### Check what's wrong?
```bash
status.bat   # Shows detailed status
logs.bat     # View error logs
```

---

## 📚 Full Documentation

See **[BATCH_FILES_GUIDE.md](BATCH_FILES_GUIDE.md)** for complete details!

---

## ✨ Features

✅ **Zero Configuration** - Just double-click and run
✅ **Auto Port Cleanup** - No more "port in use" errors
✅ **Smart Dependencies** - Auto-installs if missing
✅ **Color-Coded Output** - Easy to read status
✅ **Multiple Windows** - Separate logs for each service
✅ **Error Handling** - Checks requirements before starting

---

**Happy Car Washing! 🚗💧✨**
