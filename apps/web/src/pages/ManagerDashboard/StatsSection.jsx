import React from 'react';
import { useTranslation } from 'react-i18next';

const StatsSection = ({ stats, showFullAnalytics, setShowFullAnalytics }) => {
  const { t } = useTranslation();

  return (
    <div className="stats-section">
      <div className="stats-header">
        <h2>{t('manager.stats.title') || 'Analytics'}</h2>
        <button
          className={`toggle-analytics-btn ${showFullAnalytics ? 'active' : ''}`}
          onClick={() => setShowFullAnalytics(!showFullAnalytics)}
        >
          {showFullAnalytics ? t('manager.stats.showLess') || 'Show Less' : t('manager.stats.showMore') || 'Show All Analytics'} {showFullAnalytics ? '\u25B2' : '\u25BC'}
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">{'\uD83D\uDCCB'}</span>
          <div className="stat-content">
            <span className="stat-value">{stats.totalOrders}</span>
            <span className="stat-label">{t('manager.stats.totalOrders')}</span>
          </div>
        </div>
        <div className="stat-card pending">
          <span className="stat-icon">{'\u23F3'}</span>
          <div className="stat-content">
            <span className="stat-value">{stats.pendingCount}</span>
            <span className="stat-label">{t('manager.stats.pending')}</span>
          </div>
        </div>
        <div className="stat-card completed">
          <span className="stat-icon">{'\u2705'}</span>
          <div className="stat-content">
            <span className="stat-value">{stats.completedCount}</span>
            <span className="stat-label">{t('manager.stats.completed')}</span>
          </div>
        </div>
        <div className="stat-card revenue">
          <span className="stat-icon">{'\uD83D\uDCB0'}</span>
          <div className="stat-content">
            <span className="stat-value">AED {stats.totalRevenue}</span>
            <span className="stat-label">{t('manager.stats.revenue')}</span>
          </div>
        </div>
        <div className="stat-card average">
          <span className="stat-icon">{'\uD83D\uDCCA'}</span>
          <div className="stat-content">
            <span className="stat-value">AED {stats.avgOrderValue}</span>
            <span className="stat-label">{t('manager.stats.avgOrder')}</span>
          </div>
        </div>
        <div className="stat-card cancelled">
          <span className="stat-icon">{'\uD83D\uDCC9'}</span>
          <div className="stat-content">
            <span className="stat-value">{stats.cancellationRate}%</span>
            <span className="stat-label">{t('manager.stats.cancellationRate')}</span>
          </div>
        </div>
      </div>

      {/* Full Analytics Panel */}
      {showFullAnalytics && (
        <div className="full-analytics-panel">
          {/* Status Breakdown */}
          <div className="analytics-section">
            <h3>{t('manager.analytics.statusBreakdown') || 'Status Breakdown'}</h3>
            <div className="analytics-grid">
              <div className="analytics-item">
                <span className="analytics-label">{t('manager.filters.pending')}</span>
                <span className="analytics-value pending">{stats.pendingCount}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{t('manager.filters.confirmed')}</span>
                <span className="analytics-value confirmed">{stats.confirmedCount}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{t('manager.filters.on_the_way')}</span>
                <span className="analytics-value on-the-way">{stats.onTheWayCount}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{t('manager.filters.in_progress')}</span>
                <span className="analytics-value in-progress">{stats.inProgressCount}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{t('manager.filters.completed')}</span>
                <span className="analytics-value completed">{stats.completedCount}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{t('manager.filters.cancelled')}</span>
                <span className="analytics-value cancelled">{stats.cancelledCount}</span>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="analytics-section">
            <h3>{t('manager.analytics.revenueBreakdown') || 'Revenue Breakdown'}</h3>
            <div className="analytics-grid">
              <div className="analytics-item highlight">
                <span className="analytics-label">{t('manager.stats.revenue')}</span>
                <span className="analytics-value revenue">AED {stats.totalRevenue}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{t('manager.analytics.cashPayments') || 'Cash'}</span>
                <span className="analytics-value">AED {stats.cashRevenue}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{t('manager.analytics.cardPayments') || 'Card'}</span>
                <span className="analytics-value">AED {stats.cardRevenue}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{t('manager.stats.avgOrder')}</span>
                <span className="analytics-value">AED {stats.avgOrderValue}</span>
              </div>
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="analytics-section">
            <h3>{t('manager.analytics.sourceBreakdown') || 'Order Sources'}</h3>
            <div className="analytics-grid">
              <div className="analytics-item">
                <span className="analytics-label">{'\uD83D\uDE90'} {t('manager.sourceFilters.staff')}</span>
                <span className="analytics-value staff">{stats.staffOrders}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{'\uD83D\uDC64'} {t('manager.sourceFilters.customer')}</span>
                <span className="analytics-value customer">{stats.customerOrders}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Breakdown */}
          <div className="analytics-section">
            <h3>{t('manager.analytics.vehicleBreakdown') || 'Vehicle Types'}</h3>
            <div className="analytics-grid">
              <div className="analytics-item">
                <span className="analytics-label">{'\uD83D\uDE97'} {t('wizard.sedan')}</span>
                <span className="analytics-value">{stats.sedanCount}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{'\uD83D\uDE99'} {t('wizard.suv')}</span>
                <span className="analytics-value">{stats.suvCount}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{'\uD83D\uDE98'} {t('manager.analytics.other') || 'Other'}</span>
                <span className="analytics-value">{stats.otherVehicleCount}</span>
              </div>
            </div>
          </div>

          {/* Package Breakdown */}
          <div className="analytics-section">
            <h3>{t('manager.analytics.packageBreakdown') || 'Package Types'}</h3>
            <div className="analytics-grid">
              <div className="analytics-item">
                <span className="analytics-label">{'\u2B50'} {t('packages.platinum.name')}</span>
                <span className="analytics-value platinum">{stats.platinumCount}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{'\uD83D\uDD37'} {t('packages.titanium.name')}</span>
                <span className="analytics-value titanium">{stats.titaniumCount}</span>
              </div>
              <div className="analytics-item">
                <span className="analytics-label">{'\uD83D\uDC8E'} {t('packages.diamond.name')}</span>
                <span className="analytics-value diamond">{stats.diamondCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsSection;
