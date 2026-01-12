import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI, getApiUrl } from '../../services/api';
import { StatCardSkeleton, ChartSkeleton, ListSkeleton } from '../../components/SkeletonLoader';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeBookings: 0,
    completedToday: 0,
    pendingBookings: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState({
    revenueData: [],
    bookingsStatusData: [],
    userGrowthData: [],
    topServicesData: []
  });
  const [highlights, setHighlights] = useState({
    todayRevenue: 0,
    yesterdayRevenue: 0,
    todayBookings: 0,
    yesterdayBookings: 0,
    staffOnDuty: 0,
    totalStaff: 0,
    completionRate: 0
  });
  const [dateRange, setDateRange] = useState('week'); // 'today', 'week', 'month', 'custom'
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [user, navigate, dateRange, customDateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Calculate days based on date range
      let days = 7;
      let startDate = '';
      let endDate = '';

      if (dateRange === 'today') {
        days = 1;
      } else if (dateRange === 'week') {
        days = 7;
      } else if (dateRange === 'month') {
        days = 30;
      } else if (dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        startDate = customDateRange.startDate;
        endDate = customDateRange.endDate;
        const start = new Date(startDate);
        const end = new Date(endDate);
        days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }

      // Fetch stats
      const statsData = await adminAPI.getDashboardStats();
      setStats(statsData);

      // Fetch recent activity
      const token = localStorage.getItem('token');
      const activityResponse = await fetch(getApiUrl('/admin/recent-activity?limit=10'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        const combined = combineAndSortActivity(activityData);
        setRecentActivity(combined);
      }

      // Build chart data URL with date range
      let chartsUrl = `/admin/dashboard-charts?days=${days}`;
      if (dateRange === 'custom' && startDate && endDate) {
        chartsUrl = `/admin/dashboard-charts?startDate=${startDate}&endDate=${endDate}`;
      }

      // Fetch chart data
      const chartsResponse = await fetch(getApiUrl(chartsUrl), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (chartsResponse.ok) {
        const chartsData = await chartsResponse.json();
        setChartData(chartsData);
      }

      // Fetch today's highlights
      const highlightsResponse = await fetch(getApiUrl('/admin/today-highlights'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (highlightsResponse.ok) {
        const highlightsData = await highlightsResponse.json();
        setHighlights(highlightsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const combineAndSortActivity = (data) => {
    const activities = [];

    // Add booking activities
    (data.recentBookings || []).forEach(booking => {
      activities.push({
        type: 'booking',
        icon: getBookingIcon(booking.status),
        text: `${booking.users?.first_name || 'Guest'} ${booking.users?.last_name || ''} ${getBookingText(booking.status)} booking #${booking.booking_number}`,
        timestamp: new Date(booking.created_at),
        status: booking.status
      });
    });

    // Add user registration activities
    (data.recentUsers || []).forEach(user => {
      activities.push({
        type: 'user',
        icon: '👤',
        text: `${user.first_name} ${user.last_name} registered as ${user.role}`,
        timestamp: new Date(user.created_at),
        status: 'new'
      });
    });

    // Sort by timestamp descending
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  };

  const getBookingIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      in_progress: '🔄',
      completed: '🎉',
      cancelled: '❌'
    };
    return icons[status] || '📅';
  };

  const getBookingText = (status) => {
    const texts = {
      pending: 'created',
      confirmed: 'confirmed',
      in_progress: 'started',
      completed: 'completed',
      cancelled: 'cancelled'
    };
    return texts[status] || 'updated';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return timestamp.toLocaleDateString();
  };

  // Pie chart colors for booking status
  const STATUS_COLORS = {
    pending: '#fbbf24',
    confirmed: '#10b981',
    in_progress: '#3b82f6',
    completed: '#8b5cf6',
    cancelled: '#ef4444'
  };

  // Calculate percentage change
  const calculatePercentChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    if (range !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>{t('admin.dashboard.title')}</h1>
          <p>{t('home.welcomeBack', { name: user?.firstName })}</p>
        </div>

        {/* Date Range Filter Skeleton */}
        <div className="date-range-filter">
          <h3>📅 Time Period</h3>
          <div className="filter-buttons">
            <button className="filter-btn active">Today</button>
            <button className="filter-btn">This Week</button>
            <button className="filter-btn">This Month</button>
            <button className="filter-btn">Custom Range</button>
          </div>
        </div>

        {/* Today's Highlights Skeleton */}
        <div className="todays-highlights">
          <h2>🌟 Today's Highlights</h2>
          <StatCardSkeleton count={4} />
        </div>

        {/* Main Stats Skeleton */}
        <StatCardSkeleton count={6} />

        {/* Charts Section Skeleton */}
        <div className="charts-section">
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">📊 Revenue Trend (Last 7 Days)</h3>
              <ChartSkeleton height={300} />
            </div>
            <div className="chart-card">
              <h3 className="chart-title">📈 Bookings by Status</h3>
              <ChartSkeleton height={300} />
            </div>
            <div className="chart-card">
              <h3 className="chart-title">👥 New Users (Last 7 Days)</h3>
              <ChartSkeleton height={300} />
            </div>
            <div className="chart-card">
              <h3 className="chart-title">🏆 Top Services</h3>
              <ChartSkeleton height={300} />
            </div>
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="recent-activity">
          <h2>{t('admin.dashboard.recentActivity')}</h2>
          <ListSkeleton count={10} />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>{t('admin.dashboard.title')}</h1>
        <p>{t('home.welcomeBack', { name: user?.firstName })}</p>
      </div>

      {/* Date Range Filter */}
      <div className="date-range-filter">
        <h3>📅 Time Period</h3>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${dateRange === 'today' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('today')}
          >
            Today
          </button>
          <button
            className={`filter-btn ${dateRange === 'week' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('week')}
          >
            This Week
          </button>
          <button
            className={`filter-btn ${dateRange === 'month' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('month')}
          >
            This Month
          </button>
          <button
            className={`filter-btn ${dateRange === 'custom' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('custom')}
          >
            Custom Range
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className="custom-date-inputs">
            <input
              type="date"
              value={customDateRange.startDate}
              onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
              max={customDateRange.endDate || new Date().toISOString().split('T')[0]}
            />
            <span>to</span>
            <input
              type="date"
              value={customDateRange.endDate}
              onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
              min={customDateRange.startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}
      </div>

      {/* Today's Highlights */}
      <div className="todays-highlights">
        <h2>🌟 Today's Highlights</h2>
        <div className="highlights-grid">
          <div className="highlight-card">
            <div className="highlight-icon">💰</div>
            <div className="highlight-details">
              <p className="highlight-label">Revenue</p>
              <p className="highlight-value">AED {highlights.todayRevenue.toLocaleString()}</p>
              <div className={`highlight-change ${calculatePercentChange(highlights.todayRevenue, highlights.yesterdayRevenue) >= 0 ? 'positive' : 'negative'}`}>
                <span className="change-icon">
                  {calculatePercentChange(highlights.todayRevenue, highlights.yesterdayRevenue) >= 0 ? '↑' : '↓'}
                </span>
                <span className="change-percent">
                  {Math.abs(calculatePercentChange(highlights.todayRevenue, highlights.yesterdayRevenue))}%
                </span>
                <span className="change-label">vs yesterday</span>
              </div>
            </div>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">📅</div>
            <div className="highlight-details">
              <p className="highlight-label">Bookings</p>
              <p className="highlight-value">{highlights.todayBookings}</p>
              <div className={`highlight-change ${calculatePercentChange(highlights.todayBookings, highlights.yesterdayBookings) >= 0 ? 'positive' : 'negative'}`}>
                <span className="change-icon">
                  {calculatePercentChange(highlights.todayBookings, highlights.yesterdayBookings) >= 0 ? '↑' : '↓'}
                </span>
                <span className="change-percent">
                  {Math.abs(calculatePercentChange(highlights.todayBookings, highlights.yesterdayBookings))}%
                </span>
                <span className="change-label">vs yesterday</span>
              </div>
            </div>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">👨‍💼</div>
            <div className="highlight-details">
              <p className="highlight-label">Staff on Duty</p>
              <p className="highlight-value">{highlights.staffOnDuty} / {highlights.totalStaff}</p>
              <div className="highlight-info">
                <span>{Math.round((highlights.staffOnDuty / highlights.totalStaff) * 100) || 0}% of total staff</span>
              </div>
            </div>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">✅</div>
            <div className="highlight-details">
              <p className="highlight-label">Completion Rate</p>
              <p className="highlight-value">{highlights.completionRate}%</p>
              <div className="highlight-info">
                <span>Today's bookings completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <h3>{t('admin.dashboard.totalUsers')}</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">📅</div>
          <div className="stat-details">
            <h3>{t('admin.dashboard.totalBookings')}</h3>
            <p className="stat-number">{stats.totalBookings}</p>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">💰</div>
          <div className="stat-details">
            <h3>{t('admin.dashboard.totalRevenue')}</h3>
            <p className="stat-number">AED {stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">🔄</div>
          <div className="stat-details">
            <h3>{t('admin.dashboard.activeBookings')}</h3>
            <p className="stat-number">{stats.activeBookings}</p>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-details">
            <h3>{t('admin.dashboard.completedToday')}</h3>
            <p className="stat-number">{stats.completedToday}</p>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon">⏳</div>
          <div className="stat-details">
            <h3>{t('admin.dashboard.pendingBookings')}</h3>
            <p className="stat-number">{stats.pendingBookings}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="charts-grid">
          {/* Revenue Line Chart */}
          <div className="chart-card">
            <h3 className="chart-title">📊 Revenue Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value) => [`AED ${value}`, 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#667eea"
                  strokeWidth={3}
                  dot={{ fill: '#667eea', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bookings Pie Chart */}
          <div className="chart-card">
            <h3 className="chart-title">📈 Bookings by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.bookingsStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.bookingsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* User Growth Bar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">👥 New Users (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value) => [value, 'New Users']}
                />
                <Bar dataKey="users" fill="#48bb78" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Services Bar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">🏆 Top Services</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.topServicesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#718096" />
                <YAxis dataKey="name" type="category" stroke="#718096" width={120} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value) => [value, 'Bookings']}
                />
                <Bar dataKey="count" fill="#4299e1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>{t('home.quickActions')}</h2>
        <div className="action-buttons">
          <button onClick={() => navigate('/admin/users')} className="action-btn btn-primary">
            <span className="btn-icon">👥</span>
            {t('admin.dashboard.manageUsers')}
          </button>
          <button onClick={() => navigate('/admin/staff')} className="action-btn btn-warning">
            <span className="btn-icon">👨‍💼</span>
            Manage Staff
          </button>
          <button onClick={() => navigate('/admin/bookings')} className="action-btn btn-success">
            <span className="btn-icon">📅</span>
            {t('admin.dashboard.manageBookings')}
          </button>
          <button onClick={() => navigate('/admin/services')} className="action-btn btn-info">
            <span className="btn-icon">🚗</span>
            {t('admin.dashboard.manageServices')}
          </button>
          <button onClick={() => navigate('/admin/analytics')} className="action-btn btn-primary">
            <span className="btn-icon">📊</span>
            {t('admin.dashboard.viewAnalytics')}
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h2>{t('admin.dashboard.recentActivity')}</h2>
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-icon">{activity.icon}</span>
                <div className="activity-details">
                  <p className="activity-text">{activity.text}</p>
                  <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
