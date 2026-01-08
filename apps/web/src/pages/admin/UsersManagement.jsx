import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { getApiUrl } from '../../services/api';
import './UsersManagement.css';

const UsersManagement = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [user, navigate, currentPage, pageSize, searchTerm, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterRole !== 'all') params.append('role', filterRole);

      const response = await fetch(getApiUrl(`/admin/users?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const formattedUsers = data.users.map(u => ({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        role: u.role,
        isActive: u.is_active,
        createdAt: u.created_at,
        totalBookings: u.stats?.totalBookings || 0
      }));
      setUsers(formattedUsers);
      setTotalItems(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/admin/users/${userId}/toggle-status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle user status');
      }

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm(t('admin.users.deleteConfirm'))) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl(`/admin/users/${userId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete user');
        }

        // Refresh users list
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message={t('admin.users.loading')} />;
  }

  return (
    <div className="users-management">
      <div className="page-header">
        <div>
          <h1>{t('admin.users.title')}</h1>
          <p>{t('admin.users.description')}</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
          ← {t('admin.users.backToDashboard')}
        </button>
      </div>

      <div className="users-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('admin.users.searchUsers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-group">
          <label>{t('admin.users.filterByRole')}:</label>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">{t('admin.users.allRoles')}</option>
            <option value="customer">{t('admin.users.customers')}</option>
            <option value="staff">{t('admin.users.staff')}</option>
            <option value="admin">{t('admin.users.admins')}</option>
          </select>
        </div>

        <div className="stats-summary">
          <div className="summary-item">
            <span className="summary-label">{t('admin.users.totalUsers')}:</span>
            <span className="summary-value">{totalItems}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('admin.users.showing')}:</span>
            <span className="summary-value">{users.length}</span>
          </div>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>{t('admin.users.id')}</th>
              <th>{t('admin.users.name')}</th>
              <th>{t('admin.users.email')}</th>
              <th>{t('admin.users.role')}</th>
              <th>{t('admin.users.status')}</th>
              <th>{t('admin.users.bookings')}</th>
              <th>{t('admin.users.joined')}</th>
              <th>{t('admin.users.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td className="user-name">
                  <div className="name-avatar">
                    <span className="avatar">{u.firstName[0]}{u.lastName[0]}</span>
                    <span>{u.firstName} {u.lastName}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge role-${u.role}`}>
                    {t(`common.roles.${u.role}`)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                    {u.isActive ? t('admin.users.activeStatus') : t('admin.users.inactiveStatus')}
                  </span>
                </td>
                <td>{u.totalBookings}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button
                    className="action-icon-btn view"
                    onClick={() => handleViewUser(u)}
                    title={t('admin.users.viewDetails')}
                  >
                    👁️
                  </button>
                  <button
                    className="action-icon-btn toggle"
                    onClick={() => handleToggleStatus(u.id)}
                    title={u.isActive ? t('admin.users.deactivate') : t('admin.users.activate')}
                  >
                    {u.isActive ? '🔒' : '🔓'}
                  </button>
                  <button
                    className="action-icon-btn delete"
                    onClick={() => handleDeleteUser(u.id)}
                    title={t('admin.users.deleteUser')}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('admin.users.userDetails')}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-detail-grid">
                <div className="detail-item">
                  <label>{t('admin.users.fullName')}:</label>
                  <p>{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.email')}:</label>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.role')}:</label>
                  <p className={`role-badge role-${selectedUser.role}`}>{t(`common.roles.${selectedUser.role}`)}</p>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.status')}:</label>
                  <p className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                    {selectedUser.isActive ? t('admin.users.activeStatus') : t('admin.users.inactiveStatus')}
                  </p>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.totalBookings')}:</label>
                  <p>{selectedUser.totalBookings}</p>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.memberSince')}:</label>
                  <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
