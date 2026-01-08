# CarWash Pro - Implementation Guide for Your Business

## 🎯 GETTING YOUR CARWASH SYSTEM LIVE

This guide will walk you through implementing the complete system for your mobile car wash business with your fleet and staff.

---

## PHASE 1: INITIAL SETUP (Week 1)

### Day 1-2: Technical Setup

#### 1. Install & Configure Backend
```bash
# Clone/download the project
cd carwash-00

# Install all dependencies
npm run install-all

# Set up MongoDB (choose one):
# Option A: Local MongoDB
mongod

# Option B: MongoDB Atlas (Cloud - Recommended)
# Sign up at https://www.mongodb.com/cloud/atlas
# Create free cluster
# Get connection string
```

#### 2. Configure Environment Variables

**apps/api/.env**
```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carwash
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# Stripe (get from https://stripe.com)
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key

# Email (Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yourbusiness@gmail.com
EMAIL_PASSWORD=your-app-password

# Your Business Info
BUSINESS_NAME=Your CarWash Pro
BUSINESS_PHONE=+1-555-0100
BUSINESS_EMAIL=contact@yourcarwash.com
```

**apps/web/.env**
```env
VITE_API_URL=https://your-api-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

**apps/mobile/.env**
```env
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

#### 3. Deploy Backend to Cloud

**Option A: Railway.app (Easiest)**
```bash
# 1. Go to https://railway.app
# 2. Connect GitHub repo
# 3. Deploy from apps/api
# 4. Add environment variables
# 5. Get deployed URL
```

**Option B: Heroku**
```bash
heroku create your-carwash-api
git push heroku main
heroku config:set MONGODB_URI=...
```

**Option C: AWS/DigitalOcean**
- Use PM2 for process management
- Nginx as reverse proxy
- SSL with Let's Encrypt

---

### Day 3: Set Up Your Business Data

#### 1. Create Admin Account
```bash
# Start the API
npm run api

# Use Postman or curl
POST http://localhost:3000/api/auth/register
{
  "email": "admin@yourcarwash.com",
  "password": "SecurePassword123!",
  "firstName": "Your",
  "lastName": "Name",
  "phone": "+1-555-0100",
  "role": "admin"
}
```

#### 2. Add Your Services

Login to admin portal and add your services:

**Example: Mobile Car Wash Services**
```javascript
{
  name: "Basic Mobile Wash",
  description: "Exterior hand wash at your location",
  basePrice: 25,
  duration: 30,
  category: "basic",
  features: [
    "Hand wash exterior",
    "Wheel cleaning",
    "Window cleaning",
    "Tire shine"
  ],
  vehicleTypes: [
    { type: "sedan", priceModifier: 0 },
    { type: "suv", priceModifier: 10 },
    { type: "truck", priceModifier: 15 }
  ]
}
```

#### 3. Add Your Fleet Vehicles

For each company vehicle:
```javascript
{
  vehicleNumber: "VAN-001",
  make: "Ford",
  model: "Transit",
  year: 2022,
  licensePlate: "ABC123",
  vin: "1FTBW2CM0HKB12345",
  vehicleType: "van",
  purchaseDate: "2022-01-15",
  purchasePrice: 35000,
  fuelType: "gasoline",
  equipment: [
    { name: "Pressure Washer", serialNumber: "PW-001" },
    { name: "Water Tank (100gal)", serialNumber: "WT-001" },
    { name: "Vacuum System", serialNumber: "VS-001" }
  ]
}
```

---

### Day 4-5: Add Your Staff

#### 1. Create Employee Records

For each staff member:

```javascript
// Step 1: Create user account
POST /api/auth/register
{
  "email": "john.doe@yourcarwash.com",
  "password": "temporarypass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1-555-0101",
  "role": "staff"
}

// Step 2: Create employee profile
POST /api/employees
{
  "userId": "<user_id_from_step1>",
  "employeeId": "EMP001",
  "department": "mobile_crew",
  "position": "Car Wash Technician",
  "hireDate": "2024-01-15",
  "paymentType": "hybrid", // hourly + commission
  "hourlyRate": 18,
  "commissionRate": 5, // 5% of job value
  "bankDetails": {
    "accountName": "John Doe",
    "accountNumber": "123456789",
    "bankName": "Chase Bank",
    "routingNumber": "021000021"
  },
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1-555-0102"
  }
}

// Step 3: Assign vehicle (optional)
PUT /api/employees/<employee_id>
{
  "assignedVehicle": "<fleet_vehicle_id>"
}
```

#### 2. Set Up Face Recognition (Optional but Recommended)

**Equipment Needed:**
- Tablet/iPad with camera (one per location/vehicle)
- Good lighting
- Face recognition app integration

**Setup Process:**
1. Take multiple photos of each employee (front, angles)
2. Upload via admin portal
3. System generates face descriptor
4. Employee can now check in with face scan

---

## PHASE 2: OPERATIONS SETUP (Week 2)

### Configure Attendance System

#### 1. Set Work Hours
```javascript
// In system settings
{
  "workStartTime": "08:00",
  "workEndTime": "18:00",
  "lunchBreakDuration": 60, // minutes
  "overtimeThreshold": 8, // hours
  "lateThreshold": 15 // minutes
}
```

#### 2. Employee Check-In Methods
- **Face Recognition**: Preferred for accuracy
- **Mobile App**: GPS-verified check-in
- **Manual**: Manager override for issues

---

### Set Up Payroll Schedule

#### 1. Configure Pay Periods
```javascript
{
  "payFrequency": "biweekly", // weekly, biweekly, monthly
  "payDay": "friday",
  "cutoffDay": "sunday"
}
```

#### 2. Tax Configuration
```javascript
{
  "federalTaxRate": 0.12, // 12%
  "stateTaxRate": 0.05,   // 5% (adjust for your state)
  "socialSecurityRate": 0.062,
  "medicareRate": 0.0145
}
```

#### 3. Process First Payroll
```bash
# Generate payroll for period
POST /api/payroll/generate
{
  "payPeriodStart": "2025-01-01",
  "payPeriodEnd": "2025-01-15"
}

# Review and approve
GET /api/payroll?period=2025-01

# Process payments
POST /api/payroll/:id/process-payment
```

---

### Configure GPS Tracking (Recommended)

#### GPS Device Options:
1. **Built-in Tablet GPS** (free, uses mobile app)
2. **Dedicated GPS Trackers** ($20-50/month per vehicle)
   - Verizon Hum
   - AT&T Drive
   - Bouncie

#### Integration Steps:
```javascript
// Update fleet vehicle with GPS device
PUT /api/fleet-vehicles/:id
{
  "gpsTracker": {
    "deviceId": "GPS-VAN-001",
    "isActive": true
  }
}

// Track via API or webhook
POST /api/fleet-vehicles/:id/update-location
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "123 Main St, City, State"
}
```

---

## PHASE 3: CUSTOMER LAUNCH (Week 3)

### Set Up Customer Portal

#### 1. Deploy Web App
```bash
# Build web app
cd apps/web
npm run build

# Deploy to Vercel (Easiest)
npm install -g vercel
vercel --prod

# Or Netlify
npm install -g netlify-cli
netlify deploy --prod
```

#### 2. Publish Mobile App

**For iOS:**
```bash
# Build standalone app
cd apps/mobile
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

**For Android:**
```bash
# Build Android APK/AAB
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

**Quick Alternative: Progressive Web App (PWA)**
- Customers can add web app to home screen
- Works on both iOS and Android
- No app store approval needed

---

### Marketing & Customer Acquisition

#### 1. Set Up Loyalty Program

**Default Tier Configuration:**
```javascript
{
  tiers: {
    bronze: { minPoints: 0, benefits: ["1 point per $1 spent"] },
    silver: { minPoints: 500, benefits: ["1.5 points per $1", "5% discount"] },
    gold: { minPoints: 2000, benefits: ["2 points per $1", "10% discount"] },
    platinum: { minPoints: 5000, benefits: ["3 points per $1", "15% discount", "Priority scheduling"] }
  },
  pointsExpiry: 365 // days
}
```

#### 2. Create Subscription Plans

**Example Plans for Mobile Car Wash:**
```javascript
[
  {
    plan: "basic",
    name: "Basic Monthly",
    monthlyPrice: 29,
    washesPerMonth: 4,
    includedServices: ["Basic Wash"],
    vehicleLimit: 1
  },
  {
    plan: "premium",
    name: "Premium Monthly",
    monthlyPrice: 49,
    washesPerMonth: 8,
    includedServices: ["Basic Wash", "Interior Vacuum"],
    vehicleLimit: 1,
    priority: true
  },
  {
    plan: "family",
    name: "Family Plan",
    monthlyPrice: 99,
    washesPerMonth: 12,
    includedServices: ["All Services"],
    vehicleLimit: 3,
    priority: true
  }
]
```

---

### Launch Checklist

#### Week Before Launch:
- [ ] All staff trained on system
- [ ] Face recognition working
- [ ] Test bookings completed
- [ ] Payment processing tested
- [ ] Mobile app submitted to stores
- [ ] Marketing materials ready

#### Launch Day:
- [ ] Send email to existing customers
- [ ] Social media announcement
- [ ] Offer launch promotion (20% off first booking)
- [ ] Monitor system closely
- [ ] Support team ready

#### Week After Launch:
- [ ] Gather customer feedback
- [ ] Fix any bugs immediately
- [ ] Track key metrics
- [ ] Refine processes

---

## PHASE 4: DAILY OPERATIONS

### Morning Routine (Manager)
```
1. Check dashboard for today's bookings
2. Review staff schedule
3. Verify all employees checked in
4. Assign jobs to crew
5. Check fleet vehicle status
6. Review any customer issues
```

### Employee Daily Flow
```
1. Check-in via face recognition (8:00 AM)
2. Receive job assignments on mobile app
3. Navigate to customer location (GPS tracked)
4. Complete service, take photos
5. Customer approval & signature
6. Upload photos to system
7. Move to next job
8. Check-out (6:00 PM)
```

### End of Day (Manager)
```
1. Review all completed jobs
2. Approve attendance records
3. Check revenue vs target
4. Review customer feedback
5. Plan tomorrow's schedule
```

---

## PHASE 5: FINANCIAL MANAGEMENT

### Daily Financial Tasks
```
1. Review today's revenue
2. Record any cash expenses
3. Check pending payments
4. Reconcile Stripe transactions
```

### Weekly Financial Tasks
```
1. Generate revenue report
2. Review expense categories
3. Check fuel consumption
4. Update budget tracking
```

### Bi-Weekly Tasks
```
1. Process payroll
2. Review employee hours
3. Approve overtime
4. Generate pay stubs
5. Process direct deposits
```

### Monthly Tasks
```
1. Generate P&L statement
2. Tax preparation (save records)
3. Fleet maintenance review
4. Customer retention analysis
5. Export all reports to Excel
```

---

## REPORTING & ANALYTICS

### Key Reports to Monitor

#### Daily
- Revenue (target vs actual)
- Bookings completed
- Customer satisfaction scores
- Employee attendance

#### Weekly
- Revenue by service type
- Top performing employees
- Customer acquisition
- Fleet utilization

#### Monthly
- Profit & Loss
- Payroll costs
- Fleet expenses (fuel, maintenance)
- Customer lifetime value
- Churn rate

### How to Export Reports
```bash
# Financial report
GET /api/reports/financial/excel?startDate=2025-01-01&endDate=2025-01-31

# Payroll report
GET /api/reports/payroll/excel?period=2025-01

# Attendance report
GET /api/reports/attendance/excel?startDate=2025-01-01&endDate=2025-01-31

# Revenue report
GET /api/reports/revenue/excel?startDate=2025-01-01&endDate=2025-01-31
```

---

## TROUBLESHOOTING

### Common Issues

**Issue: Employee can't check in with face recognition**
- Solution: Ensure good lighting, retake face photos, use manual check-in temporarily

**Issue: GPS not updating**
- Solution: Check mobile app permissions, verify GPS device connection

**Issue: Payment failed**
- Solution: Check Stripe configuration, verify customer payment method

**Issue: Mobile app won't load bookings**
- Solution: Check API connection, verify authentication token

---

## SUPPORT & MAINTENANCE

### Weekly Maintenance
- Check server logs for errors
- Verify backups are running
- Update software dependencies
- Review system performance

### Monthly Maintenance
- Database optimization
- Clear old logs
- Security updates
- Performance tuning

### Backup Strategy
- **Daily**: Automated database backup
- **Weekly**: Full system backup
- **Monthly**: Archive old data
- **Backup Retention**: 90 days

---

## SCALING YOUR BUSINESS

### When to Add More Vehicles
**Indicators:**
- Booking capacity > 80% regularly
- Customer wait times > 3 days
- Revenue growing > 20% month-over-month

### When to Hire More Staff
**Indicators:**
- Overtime > 10 hours/week per employee
- Can't fulfill all bookings
- Service quality declining

### When to Add Features
**Priority order:**
1. GPS tracking (if not done)
2. Customer communication (SMS/WhatsApp)
3. Inventory management
4. Advanced analytics
5. AI scheduling

---

## SUCCESS METRICS

### First 30 Days
- [ ] 50+ customers registered
- [ ] 100+ bookings completed
- [ ] 10+ subscription signups
- [ ] 4.5+ average rating
- [ ] 95%+ on-time arrivals

### First 90 Days
- [ ] 200+ active customers
- [ ] 500+ bookings completed
- [ ] 50+ subscriptions
- [ ] 4.8+ average rating
- [ ] Positive cash flow

### First Year
- [ ] 1000+ customers
- [ ] 5000+ bookings
- [ ] 200+ subscriptions
- [ ] 20%+ profit margin
- [ ] 5-star reputation

---

## 🎯 YOU'RE READY TO LAUNCH!

Follow this guide step-by-step, and you'll have:
✅ Complete business management system
✅ Happy customers
✅ Efficient operations
✅ Real-time financial visibility
✅ Scalable platform for growth

**Good luck with your mobile car wash business! 🚗💼🚀**

Need help? Check the documentation files or create an issue on GitHub.
