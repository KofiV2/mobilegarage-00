import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoyaltyProgress from '../components/LoyaltyProgress';
import './ProfilePage.css';

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
      icon: '👤',
      label: t('profile.editProfile'),
      onClick: () => navigate('/profile/edit')
    },
    {
      id: 'language',
      icon: '🌐',
      label: t('profile.language'),
      value: i18n.language === 'ar' ? 'العربية' : 'English',
      onClick: () => handleLanguageChange(i18n.language === 'ar' ? 'en' : 'ar')
    },
    {
      id: 'about',
      icon: 'ℹ️',
      label: t('profile.aboutUs'),
      onClick: () => navigate('/about')
    },
    {
      id: 'privacy',
      icon: '🔒',
      label: t('profile.privacy'),
      onClick: () => navigate('/privacy')
    },
    {
      id: 'terms',
      icon: '📄',
      label: t('profile.terms'),
      onClick: () => navigate('/terms')
    }
  ];

  return (
    <div className="profile-page">
      {/* User Info Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {userData?.name ? userData.name.charAt(0).toUpperCase() : '👤'}
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
            <span className="menu-arrow">›</span>
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button className="logout-btn" onClick={handleLogout}>
        <span className="logout-icon">🚪</span>
        {t('profile.logout')}
      </button>

      {/* Version */}
      <p className="app-version">v2.0.0</p>
    </div>
  );
};

export default ProfilePage;
