import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayBookings: 8,
    pendingBookings: 5,
    inProgressBookings: 2,
    completedToday: 12,
    totalRevenue: 1450,
    avgServiceTime: 28
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'staff') {
      navigate('/');
      return;
    }

    fetchStaffData();
  }, [user, navigate]);

  const fetchStaffData = async () => {
    try {
      // Note: Staff-specific API endpoints are not yet implemented
      // This is demo data for UI demonstration
      // TODO: Implement /api/staff/dashboard endpoint for real data
      setTimeout(() => {
        setTodaySchedule([
          {
            id: 1,
            time: '09:00 AM',
            customer: 'John Doe',
            service: 'Premium Wash',
            vehicle: 'Toyota Camry - ABC123',
            status: 'completed',
            duration: 30
          },
          {
            id: 2,
            time: '10:00 AM',
            customer: 'Jane Smith',
            service: 'Basic Wash',
            vehicle: 'Honda Civic - XYZ789',
            status: 'in_progress',
            duration: 15
          },
          {
            id: 3,
            time: '11:30 AM',
            customer: 'Mike Johnson',
            service: 'Deluxe Wash',
            vehicle: 'BMW 3 Series - DEF456',
            status: 'pending',
            duration: 60
          },
          {
            id: 4,
            time: '02:00 PM',
            customer: 'Sarah Williams',
            service: 'Express Wash',
            vehicle: 'Ford Focus - GHI789',
            status: 'pending',
            duration: 10
          },
          {
            id: 5,
            time: '03:30 PM',
            customer: 'Tom Brown',
            service: 'Premium Wash',
            vehicle: 'Mercedes C-Class - JKL012',
            status: 'pending',
            duration: 30
          }
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      setLoading(false);
    }
  };

  const handleUpdateStatus = (bookingId, newStatus) => {
    setTodaySchedule(todaySchedule.map(booking =>
      booking.id === bookingId ? { ...booking, status: newStatus } : booking
    ));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-pending',
      in_progress: 'status-progress',
      completed: 'status-completed'
    };
    return colors[status] || '';
  };

  if (loading) {
    return <div className="staff-loading">Loading dashboard...</div>;
  }

  return (
    <div className="staff-dashboard">
      <div className="staff-header">
        <div>
          <h1>👨‍💼 Staff Dashboard</h1>
          <p>Welcome back, {user?.firstName}! Here's your schedule for today.</p>
        </div>
        <div className="current-time">
          <div className="time-label">Current Time</div>
          <div className="time-value">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      <div className="staff-stats">
        <div className="stat-card-staff stat-primary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-label">Today's Bookings</div>
            <div className="stat-value">{stats.todayBookings}</div>
          </div>
        </div>

        <div className="stat-card-staff stat-warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{stats.pendingBookings}</div>
          </div>
        </div>

        <div className="stat-card-staff stat-info">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{stats.inProgressBookings}</div>
          </div>
        </div>

        <div className="stat-card-staff stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Completed Today</div>
            <div className="stat-value">{stats.completedToday}</div>
          </div>
        </div>

        <div className="stat-card-staff stat-revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Revenue Today</div>
            <div className="stat-value">AED {stats.totalRevenue}</div>
          </div>
        </div>

        <div className="stat-card-staff stat-time">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-label">Avg Service Time</div>
            <div className="stat-value">{stats.avgServiceTime} min</div>
          </div>
        </div>
      </div>

      <div className="schedule-section">
        <div className="section-header">
          <h2>📋 Today's Schedule</h2>
          <div className="schedule-summary">
            <span className="summary-badge pending">{stats.pendingBookings} Pending</span>
            <span className="summary-badge progress">{stats.inProgressBookings} In Progress</span>
            <span className="summary-badge completed">{stats.completedToday} Completed</span>
          </div>
        </div>

        <div className="schedule-timeline">
          {todaySchedule.map(booking => (
            <div key={booking.id} className={`schedule-item ${booking.status}`}>
              <div className="schedule-time">
                <div className="time">{booking.time}</div>
                <div className="duration">{booking.duration} min</div>
              </div>

              <div className="schedule-details">
                <div className="booking-info">
                  <h3>{booking.customer}</h3>
                  <p className="service-name">{booking.service}</p>
                  <p className="vehicle-info">{booking.vehicle}</p>
                </div>

                <div className="booking-status">
                  <span className={`status-badge ${getStatusColor(booking.status)}`}>
                    {booking.status === 'pending' && '⏳ Pending'}
                    {booking.status === 'in_progress' && '🔄 In Progress'}
                    {booking.status === 'completed' && '✅ Completed'}
                  </span>
                </div>

                <div className="booking-actions">
                  {booking.status === 'pending' && (
                    <button
                      className="btn-start"
                      onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                    >
                      ▶️ Start
                    </button>
                  )}
                  {booking.status === 'in_progress' && (
                    <button
                      className="btn-complete"
                      onClick={() => handleUpdateStatus(booking.id, 'completed')}
                    >
                      ✅ Complete
                    </button>
                  )}
                  {booking.status === 'completed' && (
                    <button className="btn-view" onClick={() => navigate(`/booking/${booking.id}`)}>
                      👁️ View
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="quick-tips">
        <h3>💡 Quick Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">⏱️</span>
            <p>Stay on schedule - Complete each service within the allocated time</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">✨</span>
            <p>Quality first - Ensure thorough cleaning for customer satisfaction</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">📱</span>
            <p>Update status - Mark bookings as you progress through them</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🤝</span>
            <p>Communicate - Let customers know when their vehicle is ready</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
