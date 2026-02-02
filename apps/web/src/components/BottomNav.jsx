import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isGuest, isAuthenticated } = useAuth();

  // Don't show on auth page or landing page
  if (location.pathname === '/auth' || location.pathname === '/') {
    return null;
  }

  // Also hide on manager and staff pages
  if (location.pathname.startsWith('/manager') || location.pathname.startsWith('/staff')) {
    return null;
  }

  // Build nav items based on user status
  const navItems = [];

  // Always show home and services
  navItems.push({ path: '/dashboard', icon: 'home', label: t('nav.home') });
  navItems.push({ path: '/services', icon: 'services', label: t('nav.services') });

  // Track and Profile only for authenticated users, not guests
  if (isAuthenticated && !isGuest) {
    navItems.push({ path: '/track', icon: 'track', label: t('nav.track') });
    navItems.push({ path: '/profile', icon: 'profile', label: t('nav.profile') });
  } else if (isGuest) {
    // For guests, show a sign-in button instead
    navItems.push({ path: '/auth', icon: 'signin', label: t('nav.signIn') });
  }

  const getIcon = (icon, isActive) => {
    switch (icon) {
      case 'home':
        return (
          <svg viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'services':
        return (
          <svg viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        );
      case 'track':
        return (
          <svg viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="10" r="3" />
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
          </svg>
        );
      case 'profile':
        return (
          <svg viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'signin':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, icon, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span className="nav-icon">{getIcon(icon, isActive)}</span>
              <span className="nav-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
