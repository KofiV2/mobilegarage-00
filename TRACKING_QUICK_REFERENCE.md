# 🚀 Tracking System - Quick Reference Card

## Installation (One-Time Setup)

```sql
-- Run in Supabase SQL Editor:
-- Copy/paste all of: apps/api/database/migrations/004_add_car_wash_tracking.sql
```

## API Endpoints Cheat Sheet

### 📊 Dashboard
```http
GET /api/tracking/dashboard?period=today
# Returns: Staff summary, fleet summary, top performers
```

### 👤 Staff Tracking

#### Start Wash
```http
POST /api/tracking/staff/:employeeId/start-wash
Content-Type: application/json

{
  "booking_id": "uuid",
  "service_id": "uuid",
  "vehicle_id": "uuid"
}
```

#### Complete Wash
```http
PUT /api/tracking/staff/wash/:washId/complete
Content-Type: application/json

{
  "quality_rating": 4.5,
  "speed_rating": 4.7,
  "notes": "Great job!"
}
```

#### Get Stats
```http
GET /api/tracking/staff/:employeeId/stats?period=month
# Returns: Total washes, avg duration, quality rating, rank
```

#### Leaderboard
```http
GET /api/tracking/staff/leaderboard?period=week
# Returns: Top performers ranked by cars washed
```

### 🚐 Fleet Tracking

#### Start Job
```http
POST /api/tracking/fleet/:vehicleId/start-job
Content-Type: application/json

{
  "driver_id": "uuid",
  "booking_id": "uuid",
  "start_location": {"lat": 25.27, "lng": 55.29},
  "odometer_start": 45230
}
```

#### Update Job
```http
PUT /api/tracking/fleet/job/:jobId/update
Content-Type: application/json

{
  "status": "completed",
  "distance_km": 15.5,
  "fuel_used_liters": 2.3,
  "water_used_liters": 120
}
```

#### Get Stats
```http
GET /api/tracking/fleet/:vehicleId/stats?period=month
# Returns: Total jobs, distance, fuel efficiency
```

---

## SQL Quick Queries

### How many cars did staff member wash today?
```sql
SELECT COUNT(*)
FROM staff_car_washes
WHERE employee_id = 'uuid-here'
  AND DATE(start_time) = CURRENT_DATE
  AND status = 'completed';
```

### How many cars did fleet vehicle wash this month?
```sql
SELECT COUNT(*)
FROM fleet_vehicle_washes
WHERE fleet_vehicle_id = 'uuid-here'
  AND departure_time >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'completed';
```

### Top 5 staff this week
```sql
SELECT
  e.employee_number,
  u.first_name || ' ' || u.last_name as name,
  SUM(sds.total_cars_washed) as cars_washed
FROM staff_daily_stats sds
JOIN employees e ON sds.employee_id = e.id
JOIN users u ON e.user_id = u.id
WHERE sds.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY e.id, e.employee_number, u.first_name, u.last_name
ORDER BY cars_washed DESC
LIMIT 5;
```

### Fleet fuel efficiency
```sql
SELECT
  fv.vehicle_name,
  ROUND(SUM(distance_km) / NULLIF(SUM(fuel_used_liters), 0), 2) as km_per_liter
FROM fleet_vehicle_washes fvw
JOIN fleet_vehicles fv ON fvw.fleet_vehicle_id = fv.id
WHERE fvw.departure_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY fv.id, fv.vehicle_name
ORDER BY km_per_liter DESC;
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `staff_car_washes` | Individual wash records |
| `fleet_vehicle_washes` | Fleet job records |
| `staff_daily_stats` | Daily staff aggregates (auto-updated) |
| `fleet_vehicle_daily_stats` | Daily fleet aggregates (auto-updated) |

---

## Key Metrics

### Staff Performance
- Total cars washed
- Average duration (minutes)
- Quality rating (0-5)
- Speed rating (0-5)
- Rank among peers

### Fleet Efficiency
- Total jobs completed
- Total distance (km)
- Fuel efficiency (km/L)
- Water usage (liters)
- Utilization %

---

## Testing

```bash
# Test the entire system
node apps/api/test-tracking-system.js

# Or use batch file (Windows)
setup-tracking.bat
```

---

## Workflow Examples

### Staff Workflow
```
1. Open app → Click "Start Wash"
2. Select booking/customer
3. Wash the car
4. Click "Complete" → Rate quality
5. Stats auto-update!
```

### Fleet Workflow
```
1. Assign driver to vehicle
2. Click "Start Job" → Record odometer
3. Drive to customer (GPS tracking)
4. Perform wash
5. Return to base → Update fuel/water used
6. Stats auto-update!
```

---

## Period Parameters

- `today` - Current day only
- `week` - Last 7 days
- `month` - Last 30 days
- `all` - All time (default)

---

## Status Values

### Staff Wash Status
- `in_progress` - Currently washing
- `completed` - Done
- `cancelled` - Cancelled

### Fleet Job Status
- `scheduled` - Planned
- `in_transit` - Driving to location
- `in_progress` - Currently washing
- `completed` - Done
- `cancelled` - Cancelled

---

## Auto-Calculated Fields

✅ `duration_minutes` - Auto-calculated from start/end time
✅ `fuel_efficiency` - Auto-calculated: distance ÷ fuel
✅ `daily_rank` - Auto-updated via trigger
✅ All `*_daily_stats` tables - Auto-updated via triggers

---

## Files Location

```
apps/api/
├── database/
│   ├── migrations/
│   │   └── 004_add_car_wash_tracking.sql  ← Migration
│   └── queries/
│       └── tracking-analytics.sql          ← 15 analytics queries
├── src/
│   ├── routes/
│   │   └── tracking.js                     ← API endpoints
│   └── index.js                             ← Updated with routes
└── test-tracking-system.js                  ← Test script

Documentation/
├── CAR_WASH_TRACKING_GUIDE.md              ← Complete guide
├── TRACKING_SUMMARY.md                      ← Summary
└── TRACKING_QUICK_REFERENCE.md             ← This file
```

---

## Common Tasks

### See all washes by a staff member
```javascript
const stats = await fetch(
  `/api/tracking/staff/${employeeId}/stats?period=all`
);
```

### Get today's leaderboard
```javascript
const leaderboard = await fetch(
  '/api/tracking/staff/leaderboard?period=today'
);
```

### Check fleet vehicle efficiency
```javascript
const stats = await fetch(
  `/api/tracking/fleet/${vehicleId}/stats?period=month`
);
```

### View business dashboard
```javascript
const dashboard = await fetch(
  '/api/tracking/dashboard?period=today'
);
```

---

## Support Files

- 📖 Full Guide: `CAR_WASH_TRACKING_GUIDE.md`
- 📊 SQL Queries: `apps/api/database/queries/tracking-analytics.sql`
- 🧪 Test: `apps/api/test-tracking-system.js`
- ⚙️ Setup: `setup-tracking.bat`

---

**Keep this handy for quick reference! 📌**
