import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './BookingCalendar.css';

const BookingCalendar = ({ bookings, onBookingClick, getStatusColor, formatDate }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Get calendar data for the current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Start day of week (0 = Sunday)
    let startDay = firstDay.getDay();
    // Adjust for Arabic (start week on Saturday) if needed
    // For now, keep Sunday as first day for consistency
    
    // Build calendar grid
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, day: null });
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count bookings for this day
      const dayBookings = bookings.filter(b => {
        // Handle both string dates and Firestore timestamps
        let bookingDate = b.date;
        if (b.createdAt?.toDate) {
          bookingDate = b.createdAt.toDate().toISOString().split('T')[0];
        }
        return bookingDate === dateStr;
      });
      
      // Group by status
      const statusCounts = {
        pending: 0,
        confirmed: 0,
        on_the_way: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };
      
      dayBookings.forEach(b => {
        if (statusCounts.hasOwnProperty(b.status)) {
          statusCounts[b.status]++;
        }
      });
      
      days.push({
        date: dateStr,
        day,
        bookings: dayBookings,
        statusCounts,
        total: dayBookings.length,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      });
    }
    
    return days;
  }, [currentDate, bookings]);

  // Get bookings for selected date
  const selectedBookings = useMemo(() => {
    if (!selectedDate) return [];
    const dayData = calendarData.find(d => d.date === selectedDate);
    return dayData?.bookings || [];
  }, [selectedDate, calendarData]);

  // Navigation handlers
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Format month name
  const monthName = currentDate.toLocaleDateString(isRTL ? 'ar-AE' : 'en-AE', {
    month: 'long',
    year: 'numeric'
  });

  // Day names
  const dayNames = isRTL 
    ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '📝';
      case 'confirmed': return '✓';
      case 'on_the_way': return '🚗';
      case 'in_progress': return '🧽';
      case 'completed': return '✨';
      case 'cancelled': return '✕';
      default: return '•';
    }
  };

  // Format time for booking display
  const formatTime = (booking) => {
    if (booking.time) return booking.time;
    if (booking.createdAt?.toDate) {
      return booking.createdAt.toDate().toLocaleTimeString(isRTL ? 'ar-AE' : 'en-AE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return '';
  };

  return (
    <div className="booking-calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <button 
          className="nav-btn" 
          onClick={isRTL ? goToNextMonth : goToPrevMonth}
          aria-label={t('calendar.prevMonth', 'Previous month')}
        >
          {isRTL ? '›' : '‹'}
        </button>
        
        <div className="month-display">
          <h3>{monthName}</h3>
          <button className="today-btn" onClick={goToToday}>
            {t('calendar.today', 'Today')}
          </button>
        </div>
        
        <button 
          className="nav-btn" 
          onClick={isRTL ? goToPrevMonth : goToNextMonth}
          aria-label={t('calendar.nextMonth', 'Next month')}
        >
          {isRTL ? '‹' : '›'}
        </button>
      </div>

      {/* Day Names */}
      <div className="calendar-weekdays">
        {dayNames.map((name, idx) => (
          <div key={idx} className="weekday">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {calendarData.map((day, idx) => (
          <div
            key={idx}
            className={`calendar-day ${!day.date ? 'empty' : ''} ${day.isToday ? 'today' : ''} ${day.date === selectedDate ? 'selected' : ''} ${day.total > 0 ? 'has-bookings' : ''}`}
            onClick={() => day.date && setSelectedDate(day.date === selectedDate ? null : day.date)}
            role={day.date ? 'button' : 'presentation'}
            tabIndex={day.date ? 0 : -1}
            onKeyDown={(e) => {
              if (day.date && (e.key === 'Enter' || e.key === ' ')) {
                setSelectedDate(day.date === selectedDate ? null : day.date);
              }
            }}
          >
            {day.day && (
              <>
                <span className="day-number">{day.day}</span>
                {day.total > 0 && (
                  <div className="day-indicators">
                    {day.statusCounts.pending > 0 && (
                      <span className="indicator pending" title={`${day.statusCounts.pending} pending`}></span>
                    )}
                    {(day.statusCounts.confirmed > 0 || day.statusCounts.on_the_way > 0 || day.statusCounts.in_progress > 0) && (
                      <span className="indicator confirmed" title={`${day.statusCounts.confirmed + day.statusCounts.on_the_way + day.statusCounts.in_progress} active`}></span>
                    )}
                    {day.statusCounts.completed > 0 && (
                      <span className="indicator completed" title={`${day.statusCounts.completed} completed`}></span>
                    )}
                  </div>
                )}
                {day.total > 0 && (
                  <span className="booking-count">{day.total}</span>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot pending"></span>
          <span>{t('track.status.pending', 'Pending')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot confirmed"></span>
          <span>{t('calendar.active', 'Active')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot completed"></span>
          <span>{t('track.status.completed', 'Completed')}</span>
        </div>
      </div>

      {/* Selected Date Bookings */}
      {selectedDate && (
        <div className="selected-date-bookings">
          <h4>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString(isRTL ? 'ar-AE' : 'en-AE', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
          
          {selectedBookings.length === 0 ? (
            <p className="no-bookings-msg">{t('calendar.noBookings', 'No bookings on this day')}</p>
          ) : (
            <div className="day-bookings-list">
              {selectedBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="day-booking-item"
                  onClick={() => onBookingClick?.(booking)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onBookingClick?.(booking);
                    }
                  }}
                >
                  <div className="booking-item-header">
                    <span className={`status-dot ${getStatusColor?.(booking.status) || booking.status}`}></span>
                    <span className="booking-item-time">{formatTime(booking)}</span>
                    <span className="booking-item-status">
                      {getStatusIcon(booking.status)} {t(`track.status.${booking.status}`, booking.status)}
                    </span>
                  </div>
                  <div className="booking-item-details">
                    <span className="booking-item-package">
                      {t(`packages.${booking.package}.name`, booking.package)}
                    </span>
                    <span className="booking-item-vehicle">
                      {t(`wizard.${booking.vehicleType}`, booking.vehicleType)}
                    </span>
                    <span className="booking-item-price">AED {booking.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
