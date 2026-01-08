# Analytics Test Data - Quick Reference

## ✅ Seed Data Created Successfully

### 📊 Data Summary

**Users Created:** 5 test customers
**Vehicles Created:** 6 vehicles
**Services Available:** 8 services
**Bookings Created:** 83+ bookings across different time periods

### 📅 Booking Distribution

| Time Period | Bookings |
|-------------|----------|
| Today | ~8 bookings |
| This Week | ~20+ bookings |
| This Month | ~40+ bookings |
| Last Month | ~35 bookings |
| This Year | ~60+ bookings |

**Total Revenue (Completed Bookings):** AED 7,201.00

### 🔐 Test Credentials

```
Email: customer1@test.com
Password: password123
```

You can also use:
- customer2@test.com / password123
- customer3@test.com / password123
- customer4@test.com / password123
- customer5@test.com / password123

### 📈 Booking Status Distribution

The bookings include various statuses:
- **Completed** (40%): Paid bookings with completion timestamps
- **Confirmed** (25%): Scheduled and confirmed
- **Pending** (15%): Awaiting confirmation
- **In Progress** (10%): Currently being serviced
- **Cancelled** (10%): Cancelled with reasons

### 💰 Revenue Scenarios

- Some bookings have discounts (25% chance, 15% discount)
- Mobile service bookings have +AED 50 fee
- Payment methods: Cash, Card, Wallet
- Payment statuses: Pending, Paid, Refunded

## 🧪 Testing the Analytics Filters

### Step 1: Start the Application

**Terminal 1 - Backend:**
```bash
cd apps/api
npm start
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

### Step 2: Login

1. Open `http://localhost:5173`
2. Click "Sign In"
3. Login with:
   - Email: `customer1@test.com`
   - Password: `password123`

### Step 3: Access Analytics

1. After login, you'll be redirected to dashboard
2. Navigate to **Admin → Analytics** (if you have admin access)
3. Or use the admin sidebar to access analytics

### Step 4: Test Each Filter

#### Filter: Today
**Expected Results:**
- Should show ~8 bookings
- Revenue from today's completed bookings
- Charts showing today's activity
- Service breakdown for today

#### Filter: This Week
**Expected Results:**
- Should show ~20+ bookings
- Weekly revenue chart with 7 days
- Higher booking count than today
- More varied service distribution

#### Filter: This Month
**Expected Results:**
- Should show ~40+ bookings
- Monthly revenue trends
- Day-by-day breakdown
- All services should have data

#### Filter: This Year
**Expected Results:**
- Should show ~60+ bookings
- Complete year overview
- Month-by-month trends
- Full service statistics
- Total revenue: ~AED 7,201

### 🔍 What to Verify

**1. Booking Counts Match Filters**
- Check that "Total Bookings" count changes with each filter
- Verify the number matches the selected period

**2. Revenue Updates Correctly**
- Total revenue should change based on filter
- Only completed bookings should count toward revenue
- Should show "vs previous period" comparison

**3. Charts Update**
- Revenue chart should show correct date range
- Service distribution pie chart updates
- Timeline matches selected filter

**4. Top Services Ranking**
- Most booked services appear at top
- Booking counts are accurate
- Revenue per service is calculated correctly

**5. Status Breakdown**
- Pending, Confirmed, Completed, Cancelled counts
- Percentages add up to 100%
- Visual indicators (colors) are correct

## 📊 Expected Analytics Data

### By Time Period

**Today:**
```
Total Bookings: ~8
Completed: ~3-4
Revenue: ~AED 500-800
```

**This Week:**
```
Total Bookings: ~20
Completed: ~8-10
Revenue: ~AED 1,500-2,500
```

**This Month:**
```
Total Bookings: ~40
Completed: ~16-20
Revenue: ~AED 3,000-5,000
```

**This Year:**
```
Total Bookings: ~60+
Completed: ~24-30
Revenue: ~AED 7,000+
```

### Top Services (Expected)

Based on 8 services with random distribution:
1. Express Wash: High volume, lower price
2. Premium Wash: Medium volume, high price
3. Basic Wash: High volume, medium price
4. Deluxe Detail: Lower volume, highest price
5. Interior Only: Medium volume, medium price

### Revenue Insights

**Growth Trends:**
- Revenue should increase from Today → Week → Month → Year
- Completed bookings percentage: ~40%
- Average booking value: ~AED 150-250
- Mobile service premium: +AED 50

## 🐛 Troubleshooting

### Issue: No data showing
**Solution:**
```bash
# Re-run seed script
cd apps/api
node seed-complete-data.js
```

### Issue: Filter not working
**Solution:**
- Check browser console for errors
- Verify API endpoint is responding
- Check date range calculations in analytics code

### Issue: Wrong booking counts
**Solution:**
- Check that analytics query includes correct date filters
- Verify timezone handling
- Check SQL query in backend

### Issue: Revenue doesn't match
**Solution:**
- Ensure only 'completed' bookings count
- Check final_amount field is being used
- Verify discount calculations

## 🔄 Re-seeding Data

If you want fresh test data:

```bash
# Delete existing test bookings (optional)
# Then run seeder again
cd apps/api
node seed-complete-data.js
```

The script will:
- Create new test users (or use existing)
- Create new vehicles
- Generate new bookings with unique numbers
- Distribute across all time periods

## 📈 Analytics Features to Test

### ✅ Time Period Filters
- [x] Today
- [x] This Week
- [x] This Month
- [x] This Year

### ✅ Metrics
- [x] Total Bookings count
- [x] Total Revenue
- [x] Revenue vs Previous Period
- [x] Average booking value

### ✅ Visualizations
- [x] Revenue by Day chart
- [x] Service distribution pie chart
- [x] Status breakdown
- [x] Top services list

### ✅ Key Insights
- [x] Revenue growth indicator
- [x] Busiest day
- [x] Most popular service
- [x] Completion rate

## 🎯 Success Criteria

The analytics filters are working correctly if:

1. ✅ Each filter shows different data
2. ✅ Booking counts decrease: Year > Month > Week > Today
3. ✅ Revenue totals are consistent with booking status
4. ✅ Charts update smoothly when changing filters
5. ✅ "vs Previous Period" shows percentage change
6. ✅ No console errors
7. ✅ Data loads within 1-2 seconds

## 📝 Notes

- Booking numbers are unique (BKxxxxxx format)
- Dates are distributed realistically across periods
- ~40% of bookings are completed (paid)
- ~10% are cancelled
- Service prices range from AED 30 to AED 250
- Mobile service adds AED 50 to total

---

**Status:** ✅ Analytics test data ready
**Total Bookings Created:** 83+
**Revenue Available:** AED 7,201+
**Time Periods Covered:** Today, This Week, This Month, Last Month, This Year

Ready to test! 🚀
