import React from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizePhoneUri } from '../../utils/sanitize';
import { SkeletonList } from '../../components/Skeleton';

// Status progression flow for manager
const STATUS_FLOW = {
  pending: { next: 'confirmed', icon: '\u2713', action: 'confirm' },
  confirmed: { next: 'on_the_way', icon: '\uD83D\uDE97', action: 'dispatch' },
  on_the_way: { next: 'in_progress', icon: '\u25B6', action: 'start' },
  in_progress: { next: 'completed', icon: '\u2714', action: 'complete' }
};

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'on_the_way', 'in_progress', 'completed', 'cancelled'];
const SOURCE_FILTERS = ['all', 'staff', 'customer'];
const PACKAGE_FILTERS = ['all', 'platinum', 'titanium', 'diamond'];

// Get status badge color
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'orange';
    case 'confirmed': return 'blue';
    case 'on_the_way': return 'purple';
    case 'in_progress': return 'cyan';
    case 'completed': return 'green';
    case 'cancelled': return 'red';
    default: return 'gray';
  }
};

const BookingsTable = ({
  loading,
  bookings,
  filteredBookings,
  activeFilter,
  setActiveFilter,
  sourceFilter,
  setSourceFilter,
  searchQuery,
  setSearchQuery,
  packageFilter,
  setPackageFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  hasActiveFilters,
  clearAllFilters,
  updatingId,
  formatDate,
  handleStatusUpdate,
  handleEditBooking,
  openImageModal
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Search and Advanced Filters Section */}
      <div className="search-section">
        <div className="search-row">
          <div className="search-input-wrapper">
            <span className="search-icon">{'\uD83D\uDD0D'}</span>
            <input
              type="text"
              className="search-input"
              placeholder={t('manager.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label={t('common.clear')}
              >
                {'\u2715'}
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div className="advanced-filters-row">
          {/* Date Range Filters */}
          <div className="filter-group">
            <label className="filter-label">{t('manager.search.dateFrom')}</label>
            <input
              type="date"
              className="filter-date-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">{t('manager.search.dateTo')}</label>
            <input
              type="date"
              className="filter-date-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Package Filter */}
          <div className="filter-group">
            <label className="filter-label">{t('manager.search.package')}</label>
            <select
              className="filter-select"
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
            >
              {PACKAGE_FILTERS.map(pkg => (
                <option key={pkg} value={pkg}>
                  {pkg === 'all' ? t('manager.filters.all') : t(`packages.${pkg}.name`)}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              className="clear-filters-btn"
              onClick={clearAllFilters}
            >
              {'\u2715'} {t('manager.search.clearFilters')}
            </button>
          )}
        </div>

        {/* Results Count */}
        {(searchQuery || dateFrom || dateTo || packageFilter !== 'all') && (
          <div className="search-results-info">
            {t('manager.search.resultsCount', { count: filteredBookings.length })}
          </div>
        )}
      </div>

      {/* Filter Tabs & Actions */}
      <div className="bookings-controls">
        <div className="filters-row">
          <div className="filter-tabs">
            {STATUS_FILTERS.map(filter => (
              <button
                key={filter}
                className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {t(`manager.filters.${filter}`)}
                {filter !== 'all' && (
                  <span className="filter-count">
                    {bookings.filter(b => b.status === filter).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="source-filters">
            {SOURCE_FILTERS.map(filter => (
              <button
                key={filter}
                className={`source-tab ${sourceFilter === filter ? 'active' : ''}`}
                onClick={() => setSourceFilter(filter)}
              >
                {filter === 'all' && '\uD83D\uDCCB'}
                {filter === 'staff' && '\uD83D\uDE90'}
                {filter === 'customer' && '\uD83D\uDC64'}
                {t(`manager.sourceFilters.${filter}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bookings-section">
        {loading ? (
          <div className="loading-state">
            <SkeletonList count={5} />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">{'\uD83D\uDCCB'}</span>
            <h3>{t('manager.noBookings')}</h3>
          </div>
        ) : (
          <div className="bookings-table">
            <div className="table-header">
              <span className="col-customer">{t('manager.table.customer')}</span>
              <span className="col-vehicle">{t('manager.table.vehicle')}</span>
              <span className="col-datetime">{t('manager.table.dateTime')}</span>
              <span className="col-location">{t('manager.table.location')}</span>
              <span className="col-price">{t('manager.table.price')}</span>
              <span className="col-status">{t('manager.table.status')}</span>
              <span className="col-actions">{t('manager.table.actions')}</span>
            </div>

            <div className="table-body">
              {filteredBookings.map(booking => (
                <div key={booking.id} className={`table-row ${booking.source === 'staff' ? 'staff-order' : ''}`}>
                  <span className="col-customer">
                    <span className="customer-id">#{booking.id.slice(-6).toUpperCase()}</span>
                    {booking.source === 'staff' && (
                      <span className="staff-badge" title={booking.enteredBy}>{'\uD83D\uDE90'}</span>
                    )}
                    {booking.customerData && (
                      <div className="customer-details">
                        {booking.customerData.name && (
                          <span className="customer-name">{booking.customerData.name}</span>
                        )}
                        {sanitizePhoneUri(booking.customerData?.phone) ? (
                          <a href={`tel:${sanitizePhoneUri(booking.customerData.phone)}`} className="customer-phone">
                            {booking.customerData.phone}
                          </a>
                        ) : (
                          <span className="customer-phone">{booking.customerData?.phone || '-'}</span>
                        )}
                      </div>
                    )}
                  </span>
                  <span className="col-vehicle">
                    <span className="vehicle-info">
                      {t(`wizard.${booking.vehicleType}`)}
                      <span className="package-name">{t(`packages.${booking.package}.name`)}</span>
                    </span>
                    {booking.vehicleImageUrl && (
                      <button
                        className="view-image-btn"
                        onClick={() => openImageModal(booking.vehicleImageUrl)}
                        title={t('manager.viewImage')}
                      >
                        {'\uD83D\uDCF7'}
                      </button>
                    )}
                  </span>
                  <span className="col-datetime">
                    <span className="date">{formatDate(booking.date)}</span>
                    <span className="time">{booking.time}</span>
                  </span>
                  <span className="col-location">
                    <span className="location-area">{booking.location?.area || '-'}</span>
                    {booking.location?.villa && (
                      <span className="location-villa">{booking.location.villa}</span>
                    )}
                    {booking.vehiclesInArea > 1 && (
                      <span className="vehicles-count" title={t('manager.vehiclesInArea')}>
                        {'\uD83D\uDE97'} x{booking.vehiclesInArea}
                      </span>
                    )}
                  </span>
                  <span className="col-price">
                    AED {booking.price}
                  </span>
                  <span className="col-status">
                    <span className={`status-badge ${getStatusColor(booking.status || 'pending')}`}>
                      {t(`track.status.${booking.status || 'pending'}`)}
                    </span>
                  </span>
                  <span className="col-actions">
                    {updatingId === booking.id ? (
                      <span className="updating-spinner"></span>
                    ) : (
                      <div className="action-buttons" role="group" aria-label={t('manager.table.actions')}>
                        {/* Edit button - available for active orders */}
                        {!['completed', 'cancelled'].includes(booking.status) && (
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditBooking(booking)}
                            title={t('manager.editBooking') || 'Edit'}
                            aria-label={t('manager.editBooking') || 'Edit'}
                          >
                            {'\u270F\uFE0F'}
                          </button>
                        )}
                        {/* Progress button - move to next status */}
                        {STATUS_FLOW[booking.status] && (
                          <button
                            className={`action-btn progress status-${booking.status}`}
                            onClick={() => handleStatusUpdate(booking, STATUS_FLOW[booking.status].next)}
                            title={t(`manager.actions.${STATUS_FLOW[booking.status].action}`)}
                            aria-label={t(`manager.actions.${STATUS_FLOW[booking.status].action}`)}
                          >
                            {STATUS_FLOW[booking.status].icon}
                          </button>
                        )}
                        {/* Cancel button - available for active orders */}
                        {['pending', 'confirmed', 'on_the_way', 'in_progress'].includes(booking.status) && (
                          <button
                            className="action-btn cancel"
                            onClick={() => handleStatusUpdate(booking, 'cancelled')}
                            title={t('manager.actions.cancel')}
                            aria-label={t('manager.actions.cancel')}
                          >
                            {'\u2715'}
                          </button>
                        )}
                      </div>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BookingsTable;
