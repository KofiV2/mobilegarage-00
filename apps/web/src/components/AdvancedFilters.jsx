import React, { useState } from 'react';
import './AdvancedFilters.css';

const AdvancedFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  showDateRange = false,
  showPriceRange = false,
  showStatusFilter = false,
  showRoleFilter = false,
  statusOptions = [],
  roleOptions = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = () => {
    if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) return true;
    if (filters.priceRange && (filters.priceRange.min || filters.priceRange.max)) return true;
    if (filters.status && filters.status !== 'all') return true;
    if (filters.role && filters.role !== 'all') return true;
    return false;
  };

  const handleDateChange = (field, value) => {
    onFilterChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  const handlePriceChange = (field, value) => {
    onFilterChange({
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [field]: value ? parseFloat(value) : undefined
      }
    });
  };

  const handleStatusChange = (value) => {
    onFilterChange({
      ...filters,
      status: value
    });
  };

  const handleRoleChange = (value) => {
    onFilterChange({
      ...filters,
      role: value
    });
  };

  const handleClearAll = () => {
    setIsExpanded(false);
    onClearFilters();
  };

  return (
    <div className="advanced-filters">
      <button
        className={`filter-toggle-btn ${hasActiveFilters() ? 'active' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="filter-icon">🔧</span>
        <span>Advanced Filters</span>
        {hasActiveFilters() && <span className="filter-badge">•</span>}
        <span className={`arrow ${isExpanded ? 'up' : 'down'}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="filters-panel">
          <div className="filters-grid">
            {showDateRange && (
              <div className="filter-group">
                <label className="filter-label">Date Range</label>
                <div className="date-range-inputs">
                  <input
                    type="date"
                    className="filter-input"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    placeholder="Start date"
                  />
                  <span className="range-separator">to</span>
                  <input
                    type="date"
                    className="filter-input"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    placeholder="End date"
                  />
                </div>
              </div>
            )}

            {showPriceRange && (
              <div className="filter-group">
                <label className="filter-label">Price Range (AED)</label>
                <div className="price-range-inputs">
                  <input
                    type="number"
                    className="filter-input"
                    value={filters.priceRange?.min || ''}
                    onChange={(e) => handlePriceChange('min', e.target.value)}
                    placeholder="Min"
                    min="0"
                  />
                  <span className="range-separator">to</span>
                  <input
                    type="number"
                    className="filter-input"
                    value={filters.priceRange?.max || ''}
                    onChange={(e) => handlePriceChange('max', e.target.value)}
                    placeholder="Max"
                    min="0"
                  />
                </div>
              </div>
            )}

            {showStatusFilter && statusOptions.length > 0 && (
              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select
                  className="filter-select"
                  value={filters.status || 'all'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showRoleFilter && roleOptions.length > 0 && (
              <div className="filter-group">
                <label className="filter-label">Role</label>
                <select
                  className="filter-select"
                  value={filters.role || 'all'}
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {hasActiveFilters() && (
            <div className="filter-actions">
              <button className="clear-filters-btn" onClick={handleClearAll}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
