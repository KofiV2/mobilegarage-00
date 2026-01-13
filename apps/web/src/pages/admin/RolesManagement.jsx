import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, CheckCircle, XCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions, PERMISSIONS } from '../../utils/rbac';
import './RolesManagement.css';

const RolesManagement = () => {
  const { user } = useAuth();
  const { can } = usePermissions(user);
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState(null);
  const [showPermissionDetails, setShowPermissionDetails] = useState(false);

  // Check if user has permission to manage roles
  if (!can(PERMISSIONS.MANAGE_ROLES)) {
    return (
      <div className="roles-management-container">
        <div className="permission-denied">
          <Shield className="icon-large" />
          <h2>Access Denied</h2>
          <p>You do not have permission to manage roles.</p>
        </div>
      </div>
    );
  }

  // Fetch all roles
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      return response.json();
    },
  });

  const roles = rolesData?.roles || [];
  const permissionCategories = rolesData?.permissionCategories || {};

  const getRoleBadgeClass = (roleKey) => {
    const badgeClasses = {
      super_admin: 'role-badge-super-admin',
      admin: 'role-badge-admin',
      manager: 'role-badge-manager',
      staff: 'role-badge-staff',
      customer: 'role-badge-customer',
    };
    return badgeClasses[roleKey] || 'role-badge-default';
  };

  const handleRoleClick = (role) => {
    setSelectedRole(role);
  };

  const groupPermissionsByCategory = (permissions) => {
    const grouped = {};

    Object.entries(permissionCategories).forEach(([categoryKey, category]) => {
      const categoryPermissions = category.permissions.filter(p =>
        permissions.includes(p.key)
      );

      if (categoryPermissions.length > 0) {
        grouped[categoryKey] = {
          label: category.label,
          permissions: categoryPermissions,
        };
      }
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="roles-management-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="roles-management-container">
      <div className="roles-header">
        <div className="header-content">
          <Shield className="header-icon" />
          <div>
            <h1>Role Management</h1>
            <p>Manage user roles and permissions</p>
          </div>
        </div>
      </div>

      <div className="roles-content">
        <div className="roles-grid">
          <div className="roles-list-section">
            <h2>Roles</h2>
            <div className="roles-list">
              {roles.map((role) => (
                <div
                  key={role.key}
                  className={`role-card ${selectedRole?.key === role.key ? 'selected' : ''}`}
                  onClick={() => handleRoleClick(role)}
                >
                  <div className="role-card-header">
                    <div className="role-name">
                      <Shield className="role-icon" />
                      <span>{role.name}</span>
                    </div>
                    <span className={`role-badge ${getRoleBadgeClass(role.key)}`}>
                      {role.key}
                    </span>
                  </div>
                  <div className="role-card-stats">
                    <div className="stat">
                      <Users className="stat-icon" />
                      <span>{role.userCount || 0} users</span>
                    </div>
                    <div className="stat">
                      <CheckCircle className="stat-icon" />
                      <span>
                        {role.isWildcard ? 'All' : role.permissions.length} permissions
                      </span>
                    </div>
                  </div>
                  {role.isWildcard && (
                    <div className="wildcard-badge">
                      <Info className="info-icon" />
                      <span>Has all permissions</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="role-details-section">
            {selectedRole ? (
              <>
                <div className="role-details-header">
                  <div>
                    <h2>{selectedRole.name}</h2>
                    <span className={`role-badge ${getRoleBadgeClass(selectedRole.key)}`}>
                      {selectedRole.key}
                    </span>
                  </div>
                </div>

                {selectedRole.isWildcard ? (
                  <div className="wildcard-info">
                    <Shield className="wildcard-icon" />
                    <h3>Super Administrator</h3>
                    <p>This role has all permissions in the system, including future permissions.</p>
                    <div className="wildcard-note">
                      <Info className="info-icon" />
                      <span>No restrictions apply to this role</span>
                    </div>
                  </div>
                ) : (
                  <div className="permissions-container">
                    <div className="permissions-header">
                      <h3>Permissions ({selectedRole.permissions.length})</h3>
                      <button
                        className="btn-toggle-details"
                        onClick={() => setShowPermissionDetails(!showPermissionDetails)}
                      >
                        {showPermissionDetails ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>

                    <div className="permissions-categories">
                      {Object.entries(groupPermissionsByCategory(selectedRole.permissions)).map(
                        ([categoryKey, category]) => (
                          <div key={categoryKey} className="permission-category">
                            <h4 className="category-label">{category.label}</h4>
                            <div className="permissions-list">
                              {category.permissions.map((permission) => (
                                <div key={permission.key} className="permission-item">
                                  <CheckCircle className="permission-icon" />
                                  <div className="permission-info">
                                    <span className="permission-label">{permission.label}</span>
                                    {showPermissionDetails && (
                                      <span className="permission-description">
                                        {permission.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-selection">
                <Shield className="icon-large" />
                <h3>Select a role to view details</h3>
                <p>Click on a role from the list to view its permissions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="roles-info-panel">
        <div className="info-card">
          <h3>About Role-Based Access Control</h3>
          <p>
            RBAC (Role-Based Access Control) allows you to manage what different users can do
            in the system. Each role has a specific set of permissions that determine access
            to features and data.
          </p>
          <div className="info-note">
            <Info className="info-icon" />
            <span>
              Permissions are checked on both frontend and backend for maximum security.
            </span>
          </div>
        </div>

        <div className="info-card">
          <h3>Role Hierarchy</h3>
          <ul className="role-hierarchy">
            <li>
              <span className={`role-badge ${getRoleBadgeClass('super_admin')}`}>
                super_admin
              </span>
              <span>Full system access</span>
            </li>
            <li>
              <span className={`role-badge ${getRoleBadgeClass('admin')}`}>admin</span>
              <span>Administrative access</span>
            </li>
            <li>
              <span className={`role-badge ${getRoleBadgeClass('manager')}`}>manager</span>
              <span>Management access</span>
            </li>
            <li>
              <span className={`role-badge ${getRoleBadgeClass('staff')}`}>staff</span>
              <span>Staff operations</span>
            </li>
            <li>
              <span className={`role-badge ${getRoleBadgeClass('customer')}`}>customer</span>
              <span>Customer access</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RolesManagement;
