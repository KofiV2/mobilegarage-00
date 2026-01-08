# 🚗 Car Wash Tracking System - Complete Guide

## Track Every Car Washed by Staff & Fleet Vehicles

This comprehensive tracking system allows you to monitor:
- **Staff Performance**: How many cars each staff member washed
- **Fleet Vehicle Usage**: How many cars each vehicle washed (mobile washing)
- **Performance Metrics**: Quality ratings, efficiency, speed
- **Resource Usage**: Fuel, water, supplies consumed
- **Revenue Attribution**: Which staff/vehicles generate the most revenue

---

## 📋 Table of Contents

1. [Installation](#installation)
2. [Database Setup](#database-setup)
3. [API Endpoints](#api-endpoints)
4. [Usage Examples](#usage-examples)
5. [Analytics Queries](#analytics-queries)
6. [Dashboard Integration](#dashboard-integration)
7. [Mobile App Integration](#mobile-app-integration)

---

## 🔧 Installation

### Step 1: Run the Migration

Execute the migration to create all tracking tables:

```bash
# Using Supabase SQL Editor (Recommended)
# 1. Open Supabase Dashboard > SQL Editor
# 2. Copy contents of: apps/api/database/migrations/004_add_car_wash_tracking.sql
# 3. Paste and run

# Or using psql
psql "postgresql://postgres.gyvyoejlbbnxujcaygyr:CuZ3QVFthRc3ZIoK@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" -f apps/api/database/migrations/004_add_car_wash_tracking.sql
```

### Step 2: Verify Tables Created

Check that these tables were created:
- `staff_car_washes` - Individual car wash records by staff
- `fleet_vehicle_washes` - Jobs performed by fleet vehicles
- `staff_daily_stats` - Aggregated daily statistics for staff
- `fleet_vehicle_daily_stats` - Aggregated daily statistics for fleet

### Step 3: Restart API Server

```bash
# The tracking routes are automatically loaded
npm restart
```

---

## 📊 Database Schema

### Tables Created

#### 1. **staff_car_washes**
Tracks every car wash performed by a staff member.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| employee_id | UUID | References employees table |
| booking_id | UUID | References bookings table |
| service_id | UUID | Service performed |
| vehicle_id | UUID | Customer's vehicle |
| start_time | TIMESTAMP | When wash started |
| end_time | TIMESTAMP | When wash completed |
| duration_minutes | INTEGER | Auto-calculated duration |
| quality_rating | DECIMAL | Quality rating (0-5) |
| speed_rating | DECIMAL | Speed/efficiency rating (0-5) |
| status | VARCHAR | in_progress, completed, cancelled |
| before_photos | JSONB | Array of photo URLs |
| after_photos | JSONB | Array of photo URLs |

#### 2. **fleet_vehicle_washes**
Tracks car washes performed using fleet vehicles (mobile washing).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| fleet_vehicle_id | UUID | Fleet vehicle used |
| driver_id | UUID | Staff member driving |
| booking_id | UUID | Customer booking |
| departure_time | TIMESTAMP | When vehicle left base |
| arrival_time | TIMESTAMP | When arrived at location |
| service_start_time | TIMESTAMP | When service started |
| service_end_time | TIMESTAMP | When service completed |
| return_time | TIMESTAMP | When returned to base |
| distance_km | DECIMAL | Distance traveled |
| water_used_liters | DECIMAL | Water consumed |
| fuel_used_liters | DECIMAL | Fuel consumed |
| supplies_used | JSONB | {soap: 2, wax: 1, etc} |
| status | VARCHAR | scheduled, in_transit, in_progress, completed |

#### 3. **staff_daily_stats** (Auto-updated via triggers)
Aggregated daily performance metrics for each staff member.

#### 4. **fleet_vehicle_daily_stats** (Auto-updated via triggers)
Aggregated daily usage metrics for each fleet vehicle.

---

## 🔌 API Endpoints

### Staff Car Wash Tracking

#### Start a Car Wash
```http
POST /api/tracking/staff/:employeeId/start-wash
```

**Request Body:**
```json
{
  "booking_id": "uuid-of-booking",
  "service_id": "uuid-of-service",
  "vehicle_id": "uuid-of-vehicle",
  "location": {
    "lat": 25.276987,
    "lng": 55.296249,
    "address": "Dubai Mall"
  },
  "notes": "Customer requested extra attention to wheels"
}
```

**Response:**
```json
{
  "message": "Car wash started successfully",
  "wash": {
    "id": "uuid",
    "employee_id": "uuid",
    "booking_id": "uuid",
    "start_time": "2026-01-02T10:30:00Z",
    "status": "in_progress"
  }
}
```

#### Complete a Car Wash
```http
PUT /api/tracking/staff/wash/:washId/complete
```

**Request Body:**
```json
{
  "quality_rating": 4.8,
  "speed_rating": 4.5,
  "notes": "Completed on time, customer satisfied",
  "before_photos": ["url1", "url2"],
  "after_photos": ["url3", "url4"]
}
```

#### Get Staff Statistics
```http
GET /api/tracking/staff/:employeeId/stats?period=month
```

**Query Parameters:**
- `period`: today, week, month, all (default: all)

**Response:**
```json
{
  "employee_id": "uuid",
  "period": "month",
  "overall_stats": {
    "total_washes": 127,
    "completed_washes": 125,
    "in_progress": 2,
    "avg_duration_minutes": 45.3,
    "fastest_wash_minutes": 28,
    "slowest_wash_minutes": 72,
    "avg_quality_rating": 4.6,
    "avg_speed_rating": 4.3,
    "total_hours_worked": 94.5
  },
  "daily_breakdown": [...],
  "recent_washes": [...],
  "ranking": {
    "overall_rank": 3,
    "total_staff": 15
  }
}
```

#### Get Staff Leaderboard
```http
GET /api/tracking/staff/leaderboard?period=month
```

**Response:**
```json
{
  "period": "month",
  "leaderboard": [
    {
      "rank": 1,
      "employee_id": "uuid",
      "employee_number": "EMP001",
      "first_name": "Ahmed",
      "last_name": "Ali",
      "total_cars_washed": 156,
      "cars_completed": 154,
      "avg_duration": 42.5,
      "avg_quality_rating": 4.8,
      "total_work_minutes": 6545
    },
    // ... more staff
  ]
}
```

### Fleet Vehicle Tracking

#### Start a Fleet Job
```http
POST /api/tracking/fleet/:vehicleId/start-job
```

**Request Body:**
```json
{
  "driver_id": "uuid-of-employee",
  "booking_id": "uuid-of-booking",
  "service_id": "uuid-of-service",
  "customer_vehicle_id": "uuid-of-customer-vehicle",
  "start_location": {
    "lat": 25.276987,
    "lng": 55.296249,
    "address": "Base Location"
  },
  "odometer_start": 45230
}
```

#### Update Fleet Job
```http
PUT /api/tracking/fleet/job/:jobId/update
```

**Request Body:**
```json
{
  "status": "completed",
  "arrival_time": "2026-01-02T11:00:00Z",
  "service_start_time": "2026-01-02T11:05:00Z",
  "service_end_time": "2026-01-02T11:50:00Z",
  "return_time": "2026-01-02T12:30:00Z",
  "end_location": {
    "lat": 25.276987,
    "lng": 55.296249,
    "address": "Base Location"
  },
  "distance_km": 25.5,
  "water_used_liters": 150,
  "fuel_used_liters": 3.2,
  "supplies_used": {
    "soap": 2,
    "wax": 1,
    "microfiber_cloths": 4
  },
  "odometer_end": 45255,
  "notes": "All supplies restocked"
}
```

#### Get Fleet Vehicle Statistics
```http
GET /api/tracking/fleet/:vehicleId/stats?period=month
```

#### Get Fleet Leaderboard
```http
GET /api/tracking/fleet/leaderboard?period=month
```

### Combined Dashboard

#### Get Dashboard Overview
```http
GET /api/tracking/dashboard?period=today
```

**Response:**
```json
{
  "period": "today",
  "staff_summary": {
    "active_staff": 12,
    "total_cars_washed": 87,
    "avg_wash_duration": 43.2,
    "avg_quality_rating": 4.6
  },
  "fleet_summary": {
    "active_vehicles": 5,
    "total_washes": 23,
    "total_distance_km": 145.8,
    "avg_fuel_efficiency": 12.3
  },
  "top_staff": [...],
  "top_vehicles": [...]
}
```

---

## 💻 Usage Examples

### Example 1: Mobile App - Staff Member Workflow

```javascript
// When staff member starts washing a car
const startWash = async (employeeId, bookingId) => {
  const response = await fetch(`/api/tracking/staff/${employeeId}/start-wash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      booking_id: bookingId,
      service_id: selectedService.id,
      vehicle_id: customerVehicle.id
    })
  });

  const { wash } = await response.json();

  // Start timer in UI
  startTimer(wash.id, wash.start_time);
};

// When staff member completes washing
const completeWash = async (washId, rating) => {
  await fetch(`/api/tracking/staff/wash/${washId}/complete`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quality_rating: rating.quality,
      speed_rating: rating.speed,
      notes: rating.notes
    })
  });

  // Show success message
  showSuccess('Car wash completed!');
};
```

### Example 2: Admin Dashboard - View Performance

```javascript
// Get today's performance
const getDashboard = async () => {
  const response = await fetch('/api/tracking/dashboard?period=today');
  const data = await response.json();

  // Update dashboard UI
  updateStaffMetrics(data.staff_summary);
  updateFleetMetrics(data.fleet_summary);
  displayLeaderboard(data.top_staff);
};

// Get specific staff member's statistics
const getStaffStats = async (employeeId) => {
  const response = await fetch(`/api/tracking/staff/${employeeId}/stats?period=month`);
  const stats = await response.json();

  // Show detailed stats
  displayStaffPerformance(stats);
};
```

### Example 3: Fleet Vehicle Tracking

```javascript
// Driver starts a mobile wash job
const startFleetJob = async (vehicleId, bookingDetails) => {
  const response = await fetch(`/api/tracking/fleet/${vehicleId}/start-job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      driver_id: currentDriver.id,
      booking_id: bookingDetails.id,
      service_id: bookingDetails.serviceId,
      customer_vehicle_id: bookingDetails.vehicleId,
      start_location: await getCurrentLocation(),
      odometer_start: await getOdometerReading()
    })
  });

  const { job } = await response.json();
  startGPSTracking(job.id);
};

// Update job status at each stage
const updateJobStatus = async (jobId, status, data) => {
  await fetch(`/api/tracking/fleet/job/${jobId}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      ...data
    })
  });
};
```

---

## 📈 Analytics Queries

All analytics queries are available in:
`apps/api/database/queries/tracking-analytics.sql`

### Quick Analytics Examples

#### 1. Top 10 Performers This Month
```sql
SELECT
    e.employee_number,
    u.first_name || ' ' || u.last_name as name,
    COUNT(*) FILTER (WHERE scw.status = 'completed') as cars_washed,
    AVG(scw.quality_rating) as avg_quality
FROM employees e
JOIN users u ON e.user_id = u.id
LEFT JOIN staff_car_washes scw ON e.id = scw.employee_id
    AND scw.start_time >= DATE_TRUNC('month', CURRENT_DATE)
WHERE e.is_active = true
GROUP BY e.id, e.employee_number, u.first_name, u.last_name
ORDER BY cars_washed DESC
LIMIT 10;
```

#### 2. Fleet Vehicle Efficiency Report
```sql
SELECT
    fv.vehicle_name,
    COUNT(*) as total_jobs,
    SUM(fvw.distance_km) as total_km,
    SUM(fvw.fuel_used_liters) as total_fuel,
    ROUND(SUM(fvw.distance_km) / NULLIF(SUM(fvw.fuel_used_liters), 0), 2) as fuel_efficiency
FROM fleet_vehicles fv
LEFT JOIN fleet_vehicle_washes fvw ON fv.id = fvw.fleet_vehicle_id
    AND fvw.departure_time >= CURRENT_DATE - INTERVAL '30 days'
WHERE fv.is_active = true
GROUP BY fv.id, fv.vehicle_name
ORDER BY fuel_efficiency DESC;
```

---

## 📱 Dashboard Integration

### Staff Performance Dashboard

Create a dashboard showing:
1. **Today's Stats**
   - Total cars washed
   - Average quality rating
   - Active staff count

2. **Leaderboard**
   - Top 10 performers
   - Rankings by cars washed
   - Quality ratings

3. **Individual Stats**
   - Personal performance metrics
   - Comparison to team average
   - Improvement trends

### Fleet Management Dashboard

Track:
1. **Vehicle Utilization**
   - Total jobs per vehicle
   - Distance covered
   - Fuel efficiency

2. **Resource Usage**
   - Water consumption
   - Fuel costs
   - Supply usage

3. **Maintenance Alerts**
   - Vehicles needing service
   - Mileage tracking
   - Efficiency drops

---

## 🔄 Automatic Updates

The system uses **PostgreSQL triggers** to automatically update daily statistics:

1. **When a staff car wash is created/updated/completed:**
   - `staff_daily_stats` is automatically recalculated
   - No manual intervention needed

2. **When a fleet job is updated:**
   - `fleet_vehicle_daily_stats` is automatically updated
   - All metrics recalculated in real-time

This ensures your analytics are always up-to-date!

---

## 🎯 Business Benefits

### For Managers
- Track employee productivity in real-time
- Identify top performers for bonuses
- Spot underperforming staff needing training
- Optimize staff scheduling based on performance

### For Fleet Operations
- Monitor vehicle efficiency
- Track maintenance needs
- Optimize route planning
- Control fuel and supply costs

### For Employees
- See personal performance metrics
- Compare to team average
- Track improvement over time
- Compete on leaderboards

---

## 🚀 Next Steps

### 1. Apply the Migration
```bash
# Run the SQL migration in Supabase
```

### 2. Test the API
```bash
# Use the test script
node apps/api/test-tracking-api.js
```

### 3. Integrate with Mobile App
- Add "Start Wash" button for staff
- Show live timer during wash
- Capture before/after photos
- Display personal stats

### 4. Create Admin Dashboard
- Real-time performance monitoring
- Leaderboards and rankings
- Export reports to Excel
- Set performance goals

---

## 📞 Support

For questions or issues:
1. Check the analytics queries in `tracking-analytics.sql`
2. Review API responses for debugging
3. Check database triggers are working
4. Verify employee and fleet vehicle records exist

---

## 🎉 Features Summary

✅ **Track every car wash** by staff member
✅ **Track every job** by fleet vehicle
✅ **Automatic daily statistics** via triggers
✅ **Quality and speed ratings**
✅ **Resource usage tracking** (water, fuel, supplies)
✅ **Real-time leaderboards**
✅ **Performance analytics**
✅ **Revenue attribution**
✅ **Before/after photos**
✅ **GPS location tracking**
✅ **Comprehensive API endpoints**
✅ **15+ analytics queries ready to use**

---

**Your car wash business is now fully trackable! 🚗💧✨**
