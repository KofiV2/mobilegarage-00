import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getApiUrl } from '../../services/api';
import './Analytics.css';

const Analytics = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    revenue: {
      current: 0,
      previous: 0,
      growth: 0
    },
    bookings: {
      current: 0,
      previous: 0,
      growth: 0
    },
    customers: {
      current: 0,
      previous: 0,
      growth: 0
    },
    avgOrderValue: {
      current: 0,
      previous: 0,
      growth: 0
    }
  });
  const [topServices, setTopServices] = useState([]);
  const [revenueByDay, setRevenueByDay] = useState([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAnalytics();
  }, [user, navigate, timeframe]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch main analytics
      const analyticsResponse = await fetch(getApiUrl(`/admin/analytics?timeframe=${timeframe}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }

      // Fetch revenue by day
      const revenueResponse = await fetch(getApiUrl('/admin/analytics/revenue-by-day'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setRevenueByDay(revenueData);
      }

      // Fetch top services
      const servicesResponse = await fetch(getApiUrl('/admin/analytics/top-services?limit=4'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setTopServices(servicesData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const maxRevenue = revenueByDay.length > 0 ? Math.max(...revenueByDay.map(d => d.revenue)) : 1;

  if (loading) {
    return <LoadingSpinner fullScreen message={t('admin.analytics.loading')} />;
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>📊 {t('admin.analytics.title')}</h1>
          <p>{t('admin.analytics.description')}</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
          ← {t('admin.analytics.backToDashboard')}
        </button>
      </div>

      <div className="timeframe-selector">
        <button
          className={timeframe === 'today' ? 'active' : ''}
          onClick={() => setTimeframe('today')}
        >
          {t('admin.analytics.today')}
        </button>
        <button
          className={timeframe === 'week' ? 'active' : ''}
          onClick={() => setTimeframe('week')}
        >
          {t('admin.analytics.thisWeek')}
        </button>
        <button
          className={timeframe === 'month' ? 'active' : ''}
          onClick={() => setTimeframe('month')}
        >
          {t('admin.analytics.thisMonth')}
        </button>
        <button
          className={timeframe === 'year' ? 'active' : ''}
          onClick={() => setTimeframe('year')}
        >
          {t('admin.analytics.thisYear')}
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <h3>{t('admin.analytics.totalRevenue')}</h3>
            <span className="metric-icon">💰</span>
          </div>
          <div className="metric-value">AED {analytics.revenue.current.toLocaleString()}</div>
          <div className={`metric-growth ${analytics.revenue.growth > 0 ? 'positive' : 'negative'}`}>
            <span>{analytics.revenue.growth > 0 ? '↑' : '↓'} {Math.abs(analytics.revenue.growth)}%</span>
            <span className="vs-previous">{t('admin.analytics.vsPrevious')}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>{t('admin.analytics.totalBookings')}</h3>
            <span className="metric-icon">📅</span>
          </div>
          <div className="metric-value">{analytics.bookings.current}</div>
          <div className={`metric-growth ${analytics.bookings.growth > 0 ? 'positive' : 'negative'}`}>
            <span>{analytics.bookings.growth > 0 ? '↑' : '↓'} {Math.abs(analytics.bookings.growth)}%</span>
            <span className="vs-previous">{t('admin.analytics.vsPrevious')}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>{t('admin.analytics.newCustomers')}</h3>
            <span className="metric-icon">👥</span>
          </div>
          <div className="metric-value">{analytics.customers.current}</div>
          <div className={`metric-growth ${analytics.customers.growth > 0 ? 'positive' : 'negative'}`}>
            <span>{analytics.customers.growth > 0 ? '↑' : '↓'} {Math.abs(analytics.customers.growth)}%</span>
            <span className="vs-previous">{t('admin.analytics.vsPrevious')}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>{t('admin.analytics.avgOrderValue')}</h3>
            <span className="metric-icon">💵</span>
          </div>
          <div className="metric-value">AED {analytics.avgOrderValue.current}</div>
          <div className={`metric-growth ${analytics.avgOrderValue.growth > 0 ? 'positive' : 'negative'}`}>
            <span>{analytics.avgOrderValue.growth > 0 ? '↑' : '↓'} {Math.abs(analytics.avgOrderValue.growth)}%</span>
            <span className="vs-previous">{t('admin.analytics.vsPrevious')}</span>
          </div>
        </div>
      </div>

      <div className="analytics-row">
        <div className="chart-card">
          <h3>{t('admin.analytics.revenueByDay')}</h3>
          <div className="bar-chart">
            {revenueByDay.map(item => (
              <div key={item.day} className="bar-item">
                <div className="bar-column">
                  <div
                    className="bar-fill"
                    style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                  >
                    <span className="bar-value">AED {item.revenue}</span>
                  </div>
                </div>
                <div className="bar-label">{item.day}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3>{t('admin.analytics.topServices')}</h3>
          <div className="top-services-list">
            {topServices.map((service, index) => (
              <div key={service.name} className="service-item">
                <div className="service-rank">#{index + 1}</div>
                <div className="service-details">
                  <div className="service-name">{service.name}</div>
                  <div className="service-stats">
                    <span>{service.bookings} {t('admin.analytics.bookings')}</span>
                    <span>•</span>
                    <span>AED {service.revenue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="service-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${(service.bookings / topServices[0].bookings) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h2>📈 {t('admin.analytics.keyInsights')}</h2>
        <div className="insights-grid">
          <div className="insight-card insight-success">
            <div className="insight-icon">✅</div>
            <div className="insight-content">
              <h4>{t('admin.analytics.insightRevenueGrowing')}</h4>
              <p>{t('admin.analytics.insightRevenueGrowingDesc')}</p>
            </div>
          </div>

          <div className="insight-card insight-info">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <h4>{t('admin.analytics.insightPeakDay')}</h4>
              <p>{t('admin.analytics.insightPeakDayDesc')}</p>
            </div>
          </div>

          <div className="insight-card insight-warning">
            <div className="insight-icon">⚡</div>
            <div className="insight-content">
              <h4>{t('admin.analytics.insightOpportunity')}</h4>
              <p>{t('admin.analytics.insightOpportunityDesc')}</p>
            </div>
          </div>

          <div className="insight-card insight-primary">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>{t('admin.analytics.insightRetention')}</h4>
              <p>{t('admin.analytics.insightRetentionDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
