import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminMenuItems = [
    {
      path: '/admin/dashboard',
      icon: '📊',
      label: t('nav.dashboard'),
      key: 'dashboard'
    },
    {
      path: '/admin/users',
      icon: '👥',
      label: t('nav.users'),
      key: 'users'
    },
    {
      path: '/admin/staff',
      icon: '👨‍💼',
      label: 'Staff',
      key: 'staff'
    },
    {
      path: '/admin/bookings',
      icon: '📅',
      label: t('admin.manageBookings'),
      key: 'bookings'
    },
    {
      path: '/admin/services',
      icon: '🚗',
      label: t('admin.manageServices'),
      key: 'services'
    },
    {
      path: '/admin/analytics',
      icon: '📈',
      label: t('nav.analytics'),
      key: 'analytics'
    }
  ];

  const customerMenuItems = [
    {
      path: '/dashboard',
      icon: '🏠',
      label: t('nav.home'),
      key: 'customer-home'
    },
    {
      path: '/services',
      icon: '✨',
      label: t('customer.browseServices'),
      key: 'customer-services'
    },
    {
      path: '/bookings',
      icon: '📋',
      label: t('nav.myBookings'),
      key: 'customer-bookings'
    },
    {
      path: '/vehicles',
      icon: '🚙',
      label: t('nav.vehicles'),
      key: 'customer-vehicles'
    },
    {
      path: '/loyalty',
      icon: '⭐',
      label: t('nav.loyalty'),
      key: 'customer-loyalty'
    },
    {
      path: '/wallet',
      icon: '💰',
      label: t('nav.wallet'),
      key: 'customer-wallet'
    },
    {
      path: '/profile',
      icon: '👤',
      label: t('nav.profile'),
      key: 'customer-profile'
    }
  ];

  return (
    <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {!collapsed && <span className="logo-text">{t('app.admin')}</span>}
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-section-title">{t('admin.title')}</div>}
        <ul className="sidebar-menu">
          {adminMenuItems.map((item) => (
            <li key={item.key} className={location.pathname === item.path ? 'active' : ''}>
              <Link to={item.path} title={collapsed ? item.label : ''}>
                <span className="menu-icon">{item.icon}</span>
                {!collapsed && <span className="menu-label">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {!collapsed && <div className="sidebar-section-title" style={{ marginTop: '2rem' }}>{t('customer.customerView')}</div>}
        <ul className="sidebar-menu">
          {customerMenuItems.map((item) => (
            <li key={item.key} className={location.pathname === item.path ? 'active' : ''}>
              <Link to={item.path} title={collapsed ? item.label : ''}>
                <span className="menu-icon">{item.icon}</span>
                {!collapsed && <span className="menu-label">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <>
            <div className="admin-info">
              <div className="admin-user">
                <span className="admin-icon">👤</span>
                <div className="admin-details">
                  <span className="admin-name">{user?.firstName} {user?.lastName}</span>
                  <span className="admin-badge">Admin</span>
                </div>
              </div>
            </div>
            <div className="sidebar-actions">
              <ThemeToggle />
              <LanguageSwitcher />
              <button className="logout-btn-sidebar" onClick={handleLogout}>
                <span className="logout-icon">🚪</span>
                {t('nav.logout')}
              </button>
            </div>
          </>
        )}
        {collapsed && (
          <button className="logout-btn-sidebar collapsed" onClick={handleLogout} title={t('nav.logout')}>
            <span className="logout-icon">🚪</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;
