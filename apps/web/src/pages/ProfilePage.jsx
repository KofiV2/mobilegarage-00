import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoyaltyProgress from '../components/LoyaltyProgress';
import './ProfilePage.css';

// SVG Icons
const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const GlobeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const InfoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const FileTextIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const LogOutIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, userData, logout, updateUserProfile } = useAuth();
  const [loyalty, setLoyalty] = useState({ washCount: 0, freeWashAvailable: false });

  useEffect(() => {
    const fetchLoyalty = async () => {
      if (!user) return;
      try {
        const loyaltyDoc = await getDoc(doc(db, 'loyalty', user.uid));
        if (loyaltyDoc.exists()) {
          setLoyalty(loyaltyDoc.data());
        }
      } catch (error) {
        console.error('Error fetching loyalty:', error);
      }
    };
    fetchLoyalty();
  }, [user]);

  const handleLanguageChange = async (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (user) {
      await updateUserProfile({ language: lang });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const menuItems = [
    {
      id: 'edit-profile',
      icon: <UserIcon />,
      label: t('profile.editProfile'),
      onClick: () => navigate('/profile/edit')
    },
    {
      id: 'language',
      icon: <GlobeIcon />,
      label: t('profile.language'),
      value: i18n.language === 'ar' ? 'العربية' : 'English',
      onClick: () => handleLanguageChange(i18n.language === 'ar' ? 'en' : 'ar')
    },
    {
      id: 'about',
      icon: <InfoIcon />,
      label: t('profile.aboutUs'),
      onClick: () => navigate('/about')
    },
    {
      id: 'privacy',
      icon: <LockIcon />,
      label: t('profile.privacy'),
      onClick: () => navigate('/privacy')
    },
    {
      id: 'terms',
      icon: <FileTextIcon />,
      label: t('profile.terms'),
      onClick: () => navigate('/terms')
    }
  ];

  return (
    <div className="profile-page">
      {/* User Info Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {userData?.name ? userData.name.charAt(0).toUpperCase() : <UserIcon />}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">
            {userData?.name || t('profile.guest')}
          </h2>
          <p className="profile-phone">{user?.phoneNumber}</p>
          {userData?.email && (
            <p className="profile-email">
              {userData.email}
              {userData.emailVerified && <span className="verified-badge">✓</span>}
            </p>
          )}
        </div>
      </div>

      {/* Loyalty Card */}
      <div className="loyalty-card">
        <div className="loyalty-header">
          <h3>{t('profile.loyaltyProgram')}</h3>
          <span className="loyalty-count">{loyalty.washCount}/6</span>
        </div>
        <LoyaltyProgress count={loyalty.washCount} />
        <p className="loyalty-text">
          {loyalty.freeWashAvailable
            ? t('profile.freeWashReady')
            : t('profile.washesToGo', { count: 6 - (loyalty.washCount % 6) })}
        </p>
      </div>

      {/* Menu Items */}
      <div className="profile-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className="menu-item"
            onClick={item.onClick}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            {item.value && <span className="menu-value">{item.value}</span>}
            <span className="menu-arrow"><ChevronRightIcon /></span>
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button className="logout-btn" onClick={handleLogout}>
        <LogOutIcon />
        {t('profile.logout')}
      </button>

      {/* Version */}
      <p className="app-version">v2.0.0</p>
    </div>
  );
};

export default ProfilePage;
