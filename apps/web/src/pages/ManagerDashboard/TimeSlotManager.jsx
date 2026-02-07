import React from 'react';
import { useTranslation } from 'react-i18next';

// Generate all possible time slots from 12 PM to 12 AM
const ALL_TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = 12; hour <= 23; hour++) {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    slots.push({
      id: `${hour}:00`,
      label: `${displayHour}:00 ${period}`,
      hour: hour
    });
  }
  // Add 12 AM (midnight)
  slots.push({
    id: '24:00',
    label: '12:00 AM',
    hour: 24
  });
  return slots;
})();

const TimeSlotManager = ({
  show,
  onClose,
  bookings,
  closedSlots,
  selectedSlotDate,
  setSelectedSlotDate,
  savingSlots,
  toggleTimeSlot,
  openAllSlots,
  closeAllSlots
}) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="time-slot-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>{'\u2715'}</button>

        <h3>{'\uD83D\uDD50'} {t('manager.timeSlots.title')}</h3>
        <p className="time-slot-subtitle">{t('manager.timeSlots.subtitle')}</p>

        <div className="time-slot-date-picker">
          <label>{t('manager.timeSlots.selectDate')}</label>
          <input
            type="date"
            value={selectedSlotDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedSlotDate(e.target.value)}
          />
        </div>

        <div className="time-slot-actions">
          <button
            className="slot-action-btn open-all"
            onClick={openAllSlots}
            disabled={savingSlots}
          >
            {'\u2713'} {t('manager.timeSlots.openAll')}
          </button>
          <button
            className="slot-action-btn close-all"
            onClick={closeAllSlots}
            disabled={savingSlots}
          >
            {'\u2715'} {t('manager.timeSlots.closeAll')}
          </button>
        </div>

        <div className="time-slots-grid">
          {ALL_TIME_SLOTS.map(slot => {
            const isClosed = (closedSlots[selectedSlotDate] || []).includes(slot.id);
            const isBooked = bookings.some(
              b => b.date === selectedSlotDate &&
                   b.time === slot.id &&
                   ['pending', 'confirmed'].includes(b.status)
            );

            return (
              <button
                key={slot.id}
                className={`time-slot-item ${isClosed ? 'closed' : 'open'} ${isBooked ? 'booked' : ''}`}
                onClick={() => !isBooked && toggleTimeSlot(slot.id)}
                disabled={savingSlots || isBooked}
                title={isBooked ? t('manager.timeSlots.bookedSlot') : ''}
              >
                <span className="slot-time">{slot.label}</span>
                <span className="slot-status">
                  {isBooked ? '\uD83D\uDCC5' : isClosed ? '\uD83D\uDD12' : '\u2713'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="time-slot-legend">
          <div className="legend-item">
            <span className="legend-icon open">{'\u2713'}</span>
            <span>{t('manager.timeSlots.openSlot')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon closed">{'\uD83D\uDD12'}</span>
            <span>{t('manager.timeSlots.closedSlot')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon booked">{'\uD83D\uDCC5'}</span>
            <span>{t('manager.timeSlots.bookedSlot')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotManager;
