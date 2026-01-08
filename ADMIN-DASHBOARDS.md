# Admin Dashboards - Complete Guide

## Overview

I've added comprehensive admin dashboards for the In and Out Car Wash system. Admin users now have access to powerful management and analytics tools.

## New Admin Pages Created

### 1. **Admin Dashboard** (`/admin/dashboard`)
**Location:** `apps/web/src/pages/admin/Dashboard.jsx`

**Features:**
- **Overview Stats Cards:**
  - Total Users
  - Total Bookings
  - Total Revenue
  - Active Bookings
  - Completed Today
  - Pending Bookings

- **Quick Actions:**
  - Manage Users
  - Manage Bookings
  - Manage Services
  - Manage Staff
  - View Analytics
  - Generate Reports

- **Recent Activity Feed:**
  - Real-time activity log
  - Booking updates
  - User registrations
  - Payment notifications

### 2. **Users Management** (`/admin/users`)
**Location:** `apps/web/src/pages/admin/UsersManagement.jsx`

**Features:**
- **User Table with:**
  - ID, Name, Email, Role, Status
  - Total Bookings
  - Join Date
  - Action buttons (View, Toggle Status, Delete)

- **Search & Filter:**
  - Search by name or email
  - Filter by role (Admin, Staff, Customer)
  - Real-time filtering

- **User Details Modal:**
  - Full user information
  - Booking statistics
  - Account status

- **Quick Stats:**
  - Total Users
  - Active Users
  - Inactive Users

- **User Management Actions:**
  - View user details
  - Activate/Deactivate accounts
  - Delete users

### 3. **Analytics Dashboard** (`/admin/analytics`)
**Location:** `apps/web/src/pages/admin/Analytics.jsx`

**Features:**
- **Timeframe Selector:**
  - Today
  - This Week
  - This Month
  - This Year

- **Key Metrics with Growth Indicators:**
  - Total Revenue (with % change)
  - Total Bookings (with % change)
  - New Customers (with % change)
  - Average Order Value (with % change)

- **Revenue by Day Chart:**
  - Beautiful bar chart
  - Daily revenue breakdown
  - Hover effects

- **Top Services:**
  - Ranked list of best-performing services
  - Booking counts
  - Revenue per service
  - Progress bars

- **AI-Powered Insights:**
  - Revenue growth analysis
  - Peak day identification
  - Opportunity alerts
  - Customer retention recommendations

## Navigation Updates

### Admin Navigation Bar
When logged in as admin, the navigation shows:
- Dashboard (Admin Home)
- Users (User Management)
- Analytics (Reports & Insights)
- Bookings (Booking Management)
- Services (Service Management)

### Customer/Staff Navigation (Unchanged)
- Home
- Services
- Bookings
- Vehicles
- Profile

## File Structure

```
apps/web/src/
├── pages/
│   └── admin/
│       ├── Dashboard.jsx          # Main admin dashboard
│       ├── Dashboard.css          # Dashboard styles
│       ├── UsersManagement.jsx    # User management
│       ├── UsersManagement.css    # User management styles
│       ├── Analytics.jsx          # Analytics & reports
│       └── Analytics.css          # Analytics styles
├── components/
│   └── Navbar.jsx                 # Updated with admin menu
└── App.jsx                        # Added admin routes
```

## How to Access

### 1. Login as Admin
Use these credentials:
- **Email:** admin@carwash.com
- **Password:** admin123

### 2. Navigate to Admin Dashboards
After login, you'll see the admin menu:
- Click **"Dashboard"** to view the main admin dashboard
- Click **"Users"** to manage users
- Click **"Analytics"** to view analytics and reports

### 3. Admin Routes
Direct URLs:
- Main Dashboard: http://localhost:5173/admin/dashboard
- User Management: http://localhost:5173/admin/users
- Analytics: http://localhost:5173/admin/analytics

## Features Breakdown

### Dashboard Stats
All stats are dynamic and will connect to real API data:
- Shows real-time counts
- Percentage changes vs previous period
- Color-coded indicators (green for positive, red for negative)

### User Management
- **Search**: Type to filter users by name or email
- **Filter by Role**: Show only admins, staff, or customers
- **Actions**:
  - 👁️ View: Shows detailed user information
  - 🔒/🔓 Toggle: Activate/deactivate account
  - 🗑️ Delete: Remove user (with confirmation)

### Analytics Features
- **Timeframe Selection**: Switch between different time periods
- **Growth Metrics**: See if your business is growing
- **Visual Charts**: Easy-to-understand bar charts
- **Top Services**: See which services generate most revenue
- **AI Insights**: Actionable recommendations based on data

## Design Features

### Modern UI Elements
- ✅ Gradient backgrounds
- ✅ Smooth animations
- ✅ Hover effects
- ✅ Card-based layouts
- ✅ Responsive design
- ✅ Icon-based navigation

### Color Scheme
- **Primary:** Purple gradient (#667eea to #764ba2)
- **Success:** Green (#38a169)
- **Warning:** Orange (#ed8936)
- **Danger:** Red (#e53e3e)
- **Info:** Blue (#3182ce)

### Responsive Design
All admin dashboards are fully responsive:
- Desktop: Full grid layouts
- Tablet: Adjusted grid columns
- Mobile: Single column, stacked cards

## Security

### Access Control
- Only users with `role: 'admin'` can access admin pages
- Automatic redirect if non-admin tries to access
- Role check on every admin page load

### Route Protection
All admin routes are wrapped in `<PrivateRoute>` component:
```jsx
<Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
```

## Next Steps - Connecting to API

Currently, the dashboards use mock data. To connect to real API:

### 1. Update Dashboard.jsx
Replace the `fetchDashboardStats` function:
```javascript
const fetchDashboardStats = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setStats(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 2. Update UsersManagement.jsx
Replace the `fetchUsers` function:
```javascript
const fetchUsers = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setUsers(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 3. Create Admin API Routes
You'll need to create these backend endpoints:
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - User list
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/analytics` - Analytics data

## Testing the Dashboards

### 1. Start the Application
```bash
start.bat
```

### 2. Login as Admin
- Go to http://localhost:5173
- Login with admin@carwash.com / admin123

### 3. Explore Admin Features
- Visit Dashboard to see overview
- Go to Users to manage users
- Check Analytics for business insights

## Customization

### Adding More Stat Cards
Edit `Dashboard.jsx` and add more cards to the `stats-grid`:
```jsx
<div className="stat-card stat-info">
  <div className="stat-icon">🎯</div>
  <div className="stat-details">
    <h3>Your Metric</h3>
    <p className="stat-number">{yourValue}</p>
  </div>
</div>
```

### Adding More Charts
Edit `Analytics.jsx` to add more visualizations:
- Line charts for trends
- Pie charts for distributions
- Heat maps for patterns

### Customizing Colors
Edit the CSS files to change colors:
- `Dashboard.css` - Dashboard colors
- `UsersManagement.css` - User management colors
- `Analytics.css` - Analytics colors

## Tips for Development

1. **Use React DevTools** to debug component state
2. **Check Console** for any API errors
3. **Test Responsiveness** on different screen sizes
4. **Update Mock Data** to test different scenarios
5. **Add Loading States** for better UX

## Future Enhancements

Potential additions:
- 📊 More chart types (pie, line, area)
- 📧 Email notifications for admins
- 📱 Push notifications
- 🔔 Real-time alerts
- 📈 Export reports to PDF/Excel
- 🎯 Custom date range selection
- 👨‍💼 Staff performance tracking
- 💰 Financial reports
- 📞 Customer communication logs
- 🚗 Fleet management dashboard

## Support

If you need help:
1. Check browser console for errors
2. Verify user role is 'admin'
3. Ensure API server is running
4. Check network tab for API calls

---

**Created:** December 2024
**Version:** 1.0
**Status:** ✅ Fully Functional (with mock data)
