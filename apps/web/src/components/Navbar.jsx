import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'staff' ? '/staff/dashboard' : '/dashboard'} className="navbar-logo">
          {t('app.name')}
        </Link>

        <ul className="navbar-menu">
          {user?.role === 'staff' ? (
            // Staff Menu
            <>
              <li className={location.pathname === '/staff/dashboard' ? 'active' : ''}>
                <Link to="/staff/dashboard">{t('nav.mySchedule')}</Link>
              </li>
              <li className={location.pathname === '/bookings' ? 'active' : ''}>
                <Link to="/bookings">{t('nav.allBookings')}</Link>
              </li>
              <li className={location.pathname === '/services' ? 'active' : ''}>
                <Link to="/services">{t('nav.services')}</Link>
              </li>
              <li className={location.pathname === '/profile' ? 'active' : ''}>
                <Link to="/profile">{t('nav.profile')}</Link>
              </li>
            </>
          ) : (
            // Customer Menu (Admin users won't see this navbar on admin pages)
            <>
              <li className={location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}>
                <Link to="/dashboard">{t('nav.home')}</Link>
              </li>
              <li className={location.pathname === '/services' ? 'active' : ''}>
                <Link to="/services">{t('nav.services')}</Link>
              </li>
              <li className={location.pathname === '/bookings' ? 'active' : ''}>
                <Link to="/bookings">{t('nav.bookings')}</Link>
              </li>
              <li className={location.pathname === '/vehicles' ? 'active' : ''}>
                <Link to="/vehicles">{t('nav.vehicles')}</Link>
              </li>
              <li className={location.pathname === '/loyalty' ? 'active' : ''}>
                <Link to="/loyalty">{t('nav.loyalty')}</Link>
              </li>
              <li className={location.pathname === '/wallet' ? 'active' : ''}>
                <Link to="/wallet">{t('nav.wallet')}</Link>
              </li>
              <li className={location.pathname === '/profile' ? 'active' : ''}>
                <Link to="/profile">{t('nav.profile')}</Link>
              </li>
            </>
          )}
        </ul>

        <div className="navbar-user">
          <LanguageSwitcher />
          <span className="user-name">{user?.firstName}</span>
          <button className="logout-btn" onClick={handleLogout}>
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
