import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

const DateTimeStep = memo(function DateTimeStep({
  booking,
  availableTimeSlots,
  bookedSlots,
  allTimeSlots,
  getMinDate,
  onDateChange,
  onTimeSelect,
}) {
  const { t } = useTranslation();

  return (
    <div className="wizard-step fade-in">
      <h3 className="step-title">{t('wizard.step3')}</h3>
      <div className="datetime-section">
        <label className="input-label">{t('wizard.selectDate')}</label>
        <input
          type="date"
          className="date-input"
          value={booking.date}
          min={getMinDate()}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
      <div className="datetime-section">
        <label className="input-label">{t('wizard.selectTime')}</label>
        <p className="time-slots-info">{t('wizard.availableSlots')}</p>
        <div className="time-slots-vertical">
          {availableTimeSlots.length > 0 ? (
            availableTimeSlots.map((slot) => (
              <button
                key={slot.id}
                className={`time-slot-btn ${booking.time === slot.id ? 'selected' : ''}`}
                onClick={() => onTimeSelect(slot.id)}
              >
                <span className="slot-time">{slot.label}</span>
                <span className="slot-status available">{t('wizard.available')}</span>
              </button>
            ))
          ) : (
            <p className="no-slots-message">{t('wizard.noSlotsAvailable')}</p>
          )}
        </div>
        {bookedSlots.length > 0 && (
          <div className="booked-slots-section">
            <p className="booked-slots-label">{t('wizard.bookedSlots')}</p>
            <div className="booked-slots-list">
              {allTimeSlots.filter(slot => bookedSlots.includes(slot.id)).map((slot) => (
                <span key={slot.id} className="booked-slot-tag">{slot.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default DateTimeStep;
