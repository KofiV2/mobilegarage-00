import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { showErrorNotification, showSuccessNotification } from '../../components/ErrorNotification';
import { getApiUrl } from '../../services/api';
import './StaffManagement.css';

const StaffManagement = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Add staff form state
  const [newStaff, setNewStaff] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchStaff();
  }, [user, navigate, currentPage, pageSize, searchTerm, filterStatus]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(getApiUrl(`/admin/staff?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }

      const data = await response.json();
      const formattedStaff = data.staff.map(s => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        phone: s.phone,
        role: s.role,
        isActive: s.is_active,
        createdAt: s.created_at,
        totalBookings: s.stats?.totalBookings || 0,
        completedBookings: s.stats?.completedBookings || 0,
        todayBookings: s.stats?.todayBookings || 0
      }));
      setStaff(formattedStaff);
      setTotalItems(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching staff:', error);
      showErrorNotification('Failed to load staff members. Please try again.');
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleViewStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowModal(true);
  };

  const handleToggleStatus = async (staffId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/admin/staff/${staffId}/toggle-status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle staff status');
      }

      showSuccessNotification('Staff status updated successfully!');
      fetchStaff();
    } catch (error) {
      console.error('Error toggling staff status:', error);
      showErrorNotification('Failed to update staff status. Please try again.');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl(`/admin/staff/${staffId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete staff member');
        }

        showSuccessNotification('Staff member deleted successfully!');
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff:', error);
        showErrorNotification(error.message || 'Failed to delete staff member. Please try again.');
      }
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();

    // Validation
    if (!newStaff.email || !newStaff.password || !newStaff.first_name || !newStaff.last_name) {
      showErrorNotification('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/admin/staff'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStaff)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create staff member');
      }

      showSuccessNotification('Staff member created successfully!');
      setShowAddModal(false);
      setNewStaff({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: ''
      });
      fetchStaff();
    } catch (error) {
      console.error('Error creating staff:', error);
      showErrorNotification(error.message || 'Failed to create staff member. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading staff members..." />;
  }

  return (
    <div className="staff-management">
      <div className="page-header">
        <div>
          <h1>👨‍💼 Staff Management</h1>
          <p>Manage your car wash staff members and track their performance</p>
        </div>
        <div className="header-actions">
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            ➕ Add Staff Member
          </button>
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="staff-stats">
        <div className="stat-mini stat-total">
          <span className="stat-label">Total Staff</span>
          <span className="stat-value">{totalItems}</span>
        </div>
        <div className="stat-mini stat-active">
          <span className="stat-label">Active</span>
          <span className="stat-value">{staff.filter(s => s.isActive).length}</span>
        </div>
        <div className="stat-mini stat-inactive">
          <span className="stat-label">Inactive</span>
          <span className="stat-value">{staff.filter(s => !s.isActive).length}</span>
        </div>
      </div>

      <div className="staff-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="staff-table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Total Bookings</th>
              <th>Completed</th>
              <th>Today's Bookings</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td className="staff-name">
                  <div className="name-avatar">
                    <span className="avatar">{s.firstName[0]}{s.lastName[0]}</span>
                    <span>{s.firstName} {s.lastName}</span>
                  </div>
                </td>
                <td>{s.email}</td>
                <td>{s.phone || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${s.isActive ? 'active' : 'inactive'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{s.totalBookings}</td>
                <td>{s.completedBookings}</td>
                <td>{s.todayBookings}</td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button
                    className="action-icon-btn view"
                    onClick={() => handleViewStaff(s)}
                    title="View Details"
                  >
                    👁️
                  </button>
                  <button
                    className="action-icon-btn toggle"
                    onClick={() => handleToggleStatus(s.id)}
                    title={s.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {s.isActive ? '🔒' : '🔓'}
                  </button>
                  <button
                    className="action-icon-btn delete"
                    onClick={() => handleDeleteStaff(s.id)}
                    title="Delete Staff"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* View Staff Modal */}
      {showModal && selectedStaff && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Staff Member Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="staff-detail-grid">
                <div className="detail-item">
                  <label>Full Name:</label>
                  <p>{selectedStaff.firstName} {selectedStaff.lastName}</p>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <p>{selectedStaff.email}</p>
                </div>
                <div className="detail-item">
                  <label>Phone:</label>
                  <p>{selectedStaff.phone || 'Not provided'}</p>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <p className={`status-badge ${selectedStaff.isActive ? 'active' : 'inactive'}`}>
                    {selectedStaff.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="detail-item">
                  <label>Total Bookings:</label>
                  <p>{selectedStaff.totalBookings}</p>
                </div>
                <div className="detail-item">
                  <label>Completed Bookings:</label>
                  <p>{selectedStaff.completedBookings}</p>
                </div>
                <div className="detail-item">
                  <label>Today's Bookings:</label>
                  <p>{selectedStaff.todayBookings}</p>
                </div>
                <div className="detail-item">
                  <label>Member Since:</label>
                  <p>{new Date(selectedStaff.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Staff Member</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddStaff} className="add-staff-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={newStaff.first_name}
                      onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={newStaff.last_name}
                      onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="+971 50 123 4567"
                  />
                </div>

                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <input
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    required
                    minLength="6"
                  />
                  <small>Minimum 6 characters</small>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit">
                    ✓ Create Staff Member
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
