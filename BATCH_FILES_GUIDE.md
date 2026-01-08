# 🚀 Batch Files Guide - In and Out Car Wash

## Quick Start Scripts for Windows

This project includes several `.bat` files to make running and managing the car wash system super easy on Windows!

---

## 📋 Available Scripts

### 1. **install.bat** - First Time Setup
**Use this FIRST when setting up the project!**

**What it does:**
- ✅ Checks if Node.js and npm are installed
- ✅ Installs all dependencies (root, API, web, mobile)
- ✅ Optionally seeds the database with sample data
- ✅ Verifies everything is ready to run

**How to use:**
```bash
# Double-click install.bat OR run from command prompt:
install.bat
```

**When to use:**
- First time setting up the project
- After cloning the repository
- When dependencies get corrupted and need reinstalling

---

### 2. **start.bat** - Start All Services
**Use this to start the entire system!**

**What it does:**
- ✅ Checks if Node.js and MongoDB are installed
- ✅ **Automatically kills any processes using ports 3000, 5173, 19000, 19001**
- ✅ Installs dependencies if missing
- ✅ Optionally seeds the database
- ✅ Starts API server (port 3000)
- ✅ Starts Web app (port 5173)
- ✅ Starts Mobile app (Expo)
- ✅ Opens 3 separate terminal windows for each service

**How to use:**
```bash
# Double-click start.bat OR:
start.bat
```

**What you'll see:**
- 3 terminal windows open:
  - `In and Out Car Wash - API`
  - `In and Out Car Wash - Web`
  - `In and Out Car Wash - Mobile`

**Access URLs:**
- **API:** http://localhost:3000
- **Web:** http://localhost:5173
- **Mobile:** Expo DevTools will open automatically

**Default Login Credentials:**
- **Admin:** admin@carwash.com / admin123
- **Staff:** staff@carwash.com / staff123
- **Customer:** customer@test.com / customer123

---

### 3. **stop.bat** - Stop All Services
**Use this to stop everything running!**

**What it does:**
- ✅ Kills all Node.js processes
- ✅ Frees ports 3000, 5173, 19000, 19001
- ✅ Cleans up temporary files
- ✅ Ensures all services are completely stopped

**How to use:**
```bash
# Double-click stop.bat OR:
stop.bat
```

**When to use:**
- When you're done working and want to stop all services
- Before shutting down your computer
- When services are stuck or not responding
- Before running `start.bat` again (though start.bat does this automatically)

---

### 4. **restart.bat** - Restart Everything
**Use this to quickly restart all services!**

**What it does:**
- ✅ Runs `stop.bat` to stop all services
- ✅ Waits 2 seconds
- ✅ Runs `start.bat` to start everything again

**How to use:**
```bash
# Double-click restart.bat OR:
restart.bat
```

**When to use:**
- After making code changes
- When services become unresponsive
- When you need a fresh start without manually stopping and starting

---

### 5. **status.bat** - Check System Status
**Use this to see what's running and what's not!**

**What it does:**
- ✅ Checks if Node.js, npm, and MongoDB are installed
- ✅ Shows which ports are in use (3000, 5173, 19000)
- ✅ Displays Process IDs (PIDs) of running services
- ✅ Checks if all dependencies are installed
- ✅ Verifies database seed file exists
- ✅ Shows URLs to access services

**How to use:**
```bash
# Double-click status.bat OR:
status.bat
```

**Example output:**
```
[System Requirements]
[OK] Node.js: Installed
     Version: v18.17.0
[OK] npm: Installed
     Version: 9.8.1
[OK] MongoDB: Installed

[Port Status]
[RUNNING] Port 3000: API Server
          PID: 12345
[RUNNING] Port 5173: Web App
          PID: 67890
[STOPPED] Port 19000: Expo DevTools

[Dependencies]
[OK] Root dependencies installed
[OK] API dependencies installed
[OK] Web dependencies installed
[OK] Mobile dependencies installed
```

---

## 🎯 Typical Workflow

### **First Time Setup:**
```bash
1. install.bat          # Install everything
2. start.bat            # Start all services
3. Open browser to http://localhost:5173
```

### **Daily Development:**
```bash
1. start.bat            # Start working
2. [Make code changes]
3. restart.bat          # Restart to see changes
4. stop.bat             # When done for the day
```

### **Troubleshooting:**
```bash
1. status.bat           # Check what's running
2. stop.bat             # Stop everything
3. start.bat            # Start fresh
```

---

## ⚡ Features

### **Automatic Port Cleanup**
All scripts automatically detect and kill processes using the required ports:
- **Port 3000** - API Server
- **Port 5173** - Web App (Vite)
- **Port 19000** - Expo DevTools
- **Port 19001** - Expo Metro Bundler

No more "Port already in use" errors!

### **Dependency Auto-Install**
If `node_modules` folders are missing, `start.bat` automatically installs them.

### **Smart Error Handling**
Scripts check for:
- Node.js installation
- npm availability
- MongoDB installation (warning if not found)
- Failed installations

### **Color-Coded Output**
- 🟢 Green = Success
- 🟡 Yellow = Warning
- 🔴 Red = Error
- 🔵 Blue = Information

### **Multiple Terminal Windows**
Each service runs in its own terminal window with a descriptive title, making it easy to see logs and debug issues.

---

## 🛠️ Requirements

### **Must Have:**
- ✅ **Node.js 18+** - [Download here](https://nodejs.org/)
- ✅ **npm** (comes with Node.js)

### **Recommended:**
- ✅ **MongoDB 6.0+** - [Download here](https://www.mongodb.com/try/download/community)
- ✅ **Git** (if cloning from repository)

---

## 📁 File Locations

All batch files are in the root directory:

```
carwash-00/
├── install.bat         ← First time setup
├── start.bat           ← Start all services
├── stop.bat            ← Stop all services
├── restart.bat         ← Restart everything
├── status.bat          ← Check system status
├── BATCH_FILES_GUIDE.md ← This file
└── apps/
    ├── api/
    ├── web/
    └── mobile/
```

---

## 🐛 Troubleshooting

### **"Node.js is not installed"**
- Download and install Node.js from https://nodejs.org/
- Restart your computer
- Run `install.bat` again

### **"MongoDB command not found"**
- MongoDB is optional for initial testing
- Install MongoDB from https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud database)

### **"Port already in use"**
- Run `stop.bat` first
- Or run `start.bat` (it automatically clears ports)

### **Dependencies won't install**
1. Delete all `node_modules` folders
2. Delete `package-lock.json` files
3. Run `install.bat` again

### **Services won't start**
1. Run `status.bat` to check what's wrong
2. Run `stop.bat`
3. Check if MongoDB is running
4. Run `start.bat` again

### **Expo won't start**
1. Make sure you have the Expo Go app on your phone
2. Check firewall settings
3. Ensure your phone and computer are on the same network

---

## 🎨 Customization

### **Change Ports:**
Edit the respective package.json files:
- **API:** `apps/api/package.json` - Change port in start script
- **Web:** `apps/web/vite.config.js` - Change Vite port
- **Mobile:** Expo uses default ports (19000, 19001)

### **Add More Services:**
Edit `start.bat` and add:
```batch
start "Service Name" cmd /k "cd path\to\service && npm start && exit"
```

---

## 💡 Tips

1. **Keep terminal windows open** to see real-time logs
2. **Run status.bat** if unsure what's running
3. **Use restart.bat** after code changes
4. **Bookmark the URLs** in your browser:
   - http://localhost:3000 (API)
   - http://localhost:5173 (Web)

---

## 🎉 You're All Set!

Now you can easily manage the entire In and Out Car Wash system with simple batch files!

**Quick Commands:**
- 🚀 `start.bat` - Start everything
- 🛑 `stop.bat` - Stop everything
- 🔄 `restart.bat` - Restart everything
- 📊 `status.bat` - Check status
- 📦 `install.bat` - First time setup

---

## 📞 Need Help?

If you encounter issues:
1. Check `status.bat` output
2. Review error messages in terminal windows
3. Ensure all prerequisites are installed
4. Try `stop.bat` then `start.bat`

**Happy Car Washing! 🚗💧✨**
