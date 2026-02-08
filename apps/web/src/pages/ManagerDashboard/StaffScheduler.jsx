import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import './StaffScheduler.css';

// Time slots from 12 PM to 12 AM
const TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = 12; hour <= 23; hour++) {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const period = 'PM';
    slots.push({
      id: `${hour}:00`,
      label: `${displayHour}:00 ${period}`,
      hour
    });
  }
  slots.push({ id: '24:00', label: '12:00 AM', hour: 24 });
  return slots;
})();

// Generate week dates starting from today
const getWeekDates = (startDate = new Date()) => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: date.toDateString() === new Date().toDateString()
    });
  }
  return dates;
};

const StaffScheduler = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // State
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState({});
  const [bookingCounts, setBookingCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weekStart, setWeekStart] = useState(new Date());
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  // Fetch staff members
  useEffect(() => {
    const q = query(collection(db, 'staff'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaff(staffData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching staff:', error);
      showToast(t('errors.loadFailed'), 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [t, showToast]);

  // Fetch shifts for the current week
  useEffect(() => {
    const startDate = weekDates[0]?.date;
    const endDate = weekDates[6]?.date;
    
    if (!startDate || !endDate) return;

    const q = query(
      collection(db, 'shifts'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shiftsData = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.staffId}_${data.date}_${data.timeSlot}`;
        shiftsData[key] = { id: doc.id, ...data };
      });
      setShifts(shiftsData);
    });

    return () => unsubscribe();
  }, [weekDates]);

  // Fetch booking counts per slot
  useEffect(() => {
    const startDate = weekDates[0]?.date;
    const endDate = weekDates[6]?.date;
    
    if (!startDate || !endDate) return;

    const q = query(
      collection(db, 'bookings'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status !== 'cancelled') {
          const key = `${data.date}_${data.time}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      setBookingCounts(counts);
    });

    return () => unsubscribe();
  }, [weekDates]);

  // Add new staff member
  const handleAddStaff = async () => {
    if (!newStaffName.trim()) {
      showToast(t('validation.required'), 'error');
      return;
    }

    setSaving(true);
    try {
      const staffRef = doc(collection(db, 'staff'));
      await setDoc(staffRef, {
        name: newStaffName.trim(),
        phone: newStaffPhone.trim() || null,
        active: true,
        createdAt: serverTimestamp()
      });
      
      showToast(t('staff.addSuccess') || 'Staff member added', 'success');
      setNewStaffName('');
      setNewStaffPhone('');
      setShowAddStaff(false);
    } catch (error) {
      console.error('Error adding staff:', error);
      showToast(t('errors.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle shift assignment
  const toggleShift = async (staffId, date, timeSlot) => {
    const key = `${staffId}_${date}_${timeSlot}`;
    const existing = shifts[key];

    setSaving(true);
    try {
      if (existing) {
        // Remove shift
        await deleteDoc(doc(db, 'shifts', existing.id));
        showToast(t('staff.shiftRemoved') || 'Shift removed', 'success');
      } else {
        // Add shift
        const shiftRef = doc(collection(db, 'shifts'));
        await setDoc(shiftRef, {
          staffId,
          date,
          timeSlot,
          createdAt: serverTimestamp()
        });
        showToast(t('staff.shiftAdded') || 'Shift assigned', 'success');
      }
    } catch (error) {
      console.error('Error toggling shift:', error);
      showToast(t('errors.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete staff member
  const handleDeleteStaff = async (staffMember) => {
    const confirmed = await confirm({
      title: t('staff.deleteConfirm') || 'Delete Staff Member?',
      message: t('staff.deleteWarning', { name: staffMember.name }) || 
        `Are you sure you want to remove ${staffMember.name}? This will also remove all their shifts.`,
      confirmText: t('common.delete') || 'Delete',
      cancelText: t('common.cancel') || 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    setSaving(true);
    try {
      // Delete all shifts for this staff member
      const shiftsQuery = query(
        collection(db, 'shifts'),
        where('staffId', '==', staffMember.id)
      );
      const shiftsSnapshot = await getDocs(shiftsQuery);
      const deletePromises = shiftsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete staff member
      await deleteDoc(doc(db, 'staff', staffMember.id));
      showToast(t('staff.deleteSuccess') || 'Staff member removed', 'success');
    } catch (error) {
      console.error('Error deleting staff:', error);
      showToast(t('errors.deleteFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Navigate weeks
  const navigateWeek = (direction) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + (direction * 7));
    setWeekStart(newStart);
  };

  // Get shift count for a date
  const getShiftCount = (date, timeSlot) => {
    return staff.filter(s => shifts[`${s.id}_${date}_${timeSlot}`]).length;
  };

  // Get booking count for a slot
  const getBookingCount = (date, timeSlot) => {
    return bookingCounts[`${date}_${timeSlot}`] || 0;
  };

  // Check if slot is understaffed
  const isUnderstaffed = (date, timeSlot) => {
    const bookings = getBookingCount(date, timeSlot);
    const staffCount = getShiftCount(date, timeSlot);
    return bookings > 0 && staffCount < Math.ceil(bookings / 3); // 1 staff per 3 bookings
  };

  if (loading) {
    return (
      <div className="staff-scheduler-overlay">
        <div className="staff-scheduler-modal">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-scheduler-overlay" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="staff-scheduler-modal">
        {/* Header */}
        <div className="scheduler-header">
          <div className="header-left">
            <h2>📅 {t('staff.scheduler') || 'Staff Scheduler'}</h2>
            <span className="staff-count">
              {staff.length} {t('staff.members') || 'staff members'}
            </span>
          </div>
          <div className="header-actions">
            <button 
              className="btn-add-staff"
              onClick={() => setShowAddStaff(true)}
            >
              ➕ {t('staff.addNew') || 'Add Staff'}
            </button>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="week-navigation">
          <button onClick={() => navigateWeek(-1)} className="nav-btn">
            {isRTL ? '→' : '←'} {t('common.previous') || 'Previous'}
          </button>
          <div className="week-label">
            {weekDates[0]?.month} {weekDates[0]?.dayNum} - {weekDates[6]?.month} {weekDates[6]?.dayNum}
          </div>
          <button onClick={() => navigateWeek(1)} className="nav-btn">
            {t('common.next') || 'Next'} {isRTL ? '←' : '→'}
          </button>
          <button 
            onClick={() => setWeekStart(new Date())} 
            className="nav-btn today-btn"
          >
            {t('common.today') || 'Today'}
          </button>
        </div>

        {/* Add Staff Form */}
        {showAddStaff && (
          <div className="add-staff-form">
            <input
              type="text"
              placeholder={t('staff.namePlaceholder') || 'Staff name'}
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              autoFocus
            />
            <input
              type="tel"
              placeholder={t('staff.phonePlaceholder') || 'Phone (optional)'}
              value={newStaffPhone}
              onChange={(e) => setNewStaffPhone(e.target.value)}
            />
            <button 
              onClick={handleAddStaff} 
              disabled={saving || !newStaffName.trim()}
              className="btn-save"
            >
              {saving ? '...' : t('common.save') || 'Save'}
            </button>
            <button 
              onClick={() => setShowAddStaff(false)}
              className="btn-cancel"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
          </div>
        )}

        {/* Schedule Grid */}
        <div className="schedule-container">
          <table className="schedule-grid">
            <thead>
              <tr>
                <th className="staff-header">{t('staff.member') || 'Staff'}</th>
                {weekDates.map(day => (
                  <th 
                    key={day.date} 
                    className={`day-header ${day.isToday ? 'today' : ''}`}
                  >
                    <div className="day-name">{day.dayName}</div>
                    <div className="day-num">{day.dayNum}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="no-staff">
                    <div className="empty-state">
                      <span className="empty-icon">👥</span>
                      <p>{t('staff.noStaff') || 'No staff members yet'}</p>
                      <button onClick={() => setShowAddStaff(true)} className="btn-add-first">
                        {t('staff.addFirst') || 'Add your first staff member'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                staff.map(member => (
                  <tr key={member.id}>
                    <td className="staff-cell">
                      <div className="staff-info">
                        <span className="staff-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="staff-details">
                          <span className="staff-name">{member.name}</span>
                          {member.phone && (
                            <span className="staff-phone">{member.phone}</span>
                          )}
                        </div>
                        <button 
                          className="btn-delete-staff"
                          onClick={() => handleDeleteStaff(member)}
                          title={t('common.delete')}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                    {weekDates.map(day => {
                      // Count shifts for this staff on this day
                      const dayShifts = TIME_SLOTS.filter(
                        slot => shifts[`${member.id}_${day.date}_${slot.id}`]
                      ).length;
                      
                      return (
                        <td 
                          key={day.date}
                          className={`day-cell ${day.isToday ? 'today' : ''} ${dayShifts > 0 ? 'has-shifts' : ''}`}
                          onClick={() => setSelectedCell({ staffId: member.id, date: day.date })}
                        >
                          {dayShifts > 0 ? (
                            <div className="shift-indicator">
                              <span className="shift-count">{dayShifts}</span>
                              <span className="shift-label">
                                {dayShifts === 1 ? 'shift' : 'shifts'}
                              </span>
                            </div>
                          ) : (
                            <span className="no-shift">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Shift Detail Panel */}
        {selectedCell && (
          <div className="shift-detail-panel">
            <div className="panel-header">
              <h3>
                {staff.find(s => s.id === selectedCell.staffId)?.name} — {' '}
                {new Date(selectedCell.date + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h3>
              <button onClick={() => setSelectedCell(null)} className="btn-close-panel">✕</button>
            </div>
            <div className="time-slots-grid">
              {TIME_SLOTS.map(slot => {
                const key = `${selectedCell.staffId}_${selectedCell.date}_${slot.id}`;
                const isAssigned = !!shifts[key];
                const bookings = getBookingCount(selectedCell.date, slot.id);
                const understaffed = isUnderstaffed(selectedCell.date, slot.id);

                return (
                  <button
                    key={slot.id}
                    className={`time-slot-btn ${isAssigned ? 'assigned' : ''} ${understaffed ? 'understaffed' : ''}`}
                    onClick={() => toggleShift(selectedCell.staffId, selectedCell.date, slot.id)}
                    disabled={saving}
                  >
                    <span className="slot-time">{slot.label}</span>
                    {bookings > 0 && (
                      <span className="booking-badge">{bookings} 📋</span>
                    )}
                    {isAssigned && <span className="check-mark">✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="panel-legend">
              <span className="legend-item">
                <span className="legend-dot assigned"></span> Assigned
              </span>
              <span className="legend-item">
                <span className="legend-dot understaffed"></span> Needs more staff
              </span>
              <span className="legend-item">
                📋 = Bookings for this slot
              </span>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="scheduler-stats">
          <div className="stat-item">
            <span className="stat-value">{staff.length}</span>
            <span className="stat-label">{t('staff.totalStaff') || 'Staff'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {Object.keys(shifts).length}
            </span>
            <span className="stat-label">{t('staff.shiftsThisWeek') || 'Shifts this week'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {Object.values(bookingCounts).reduce((a, b) => a + b, 0)}
            </span>
            <span className="stat-label">{t('staff.bookingsThisWeek') || 'Bookings this week'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffScheduler;
