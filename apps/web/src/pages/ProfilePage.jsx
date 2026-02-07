import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoyaltyProgress from '../components/LoyaltyProgress';
import SavedVehicles from '../components/SavedVehicles';
import ReferralCard from '../components/ReferralCard';
import ThemeToggle from '../components/ThemeToggle';
import Skeleton, { SkeletonProfile } from '../components/Skeleton';
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

const MoonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, userData, logout, updateUserProfile } = useAuth();
  const [loyalty, setLoyalty] = useState({ washCount: 0, freeWashAvailable: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLoyalty = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const loyaltyDoc = await getDoc(doc(db, 'loyalty', user.uid));
        if (loyaltyDoc.exists()) {
          setLoyalty(loyaltyDoc.data());
        }
      } catch (error) {
        logger.error('Error fetching loyalty', error, { uid: user.uid });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoyalty();
  }, [user]);

  const handleLanguageChange = async (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (user) {
      try {
        const result = await updateUserProfile({ language: lang });
        if (!result.success) {
          logger.error('Failed to update language preference', null, { language: lang, error: result.error });
        }
      } catch (error) {
        logger.error('Error updating language preference', error, { language: lang });
      }
    }
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result?.success !== false) {
        navigate('/auth');
      }
    } catch (error) {
      logger.error('Logout error', error);
      // Still navigate - user wants to leave
      navigate('/auth');
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        {/* Skeleton Profile Header */}
        <div className="profile-header">
          <Skeleton variant="circle" width={80} height={80} />
          <div className="profile-info">
            <Skeleton variant="text" width={150} height={24} />
            <Skeleton variant="text" width={120} height={16} />
          </div>
        </div>

        {/* Skeleton Loyalty Card */}
        <div className="loyalty-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Skeleton variant="text" width={140} height={20} />
            <Skeleton variant="text" width={40} height={20} />
          </div>
          <Skeleton variant="rect" width="100%" height={12} borderRadius={6} />
          <Skeleton variant="text" width="50%" height={14} className="skeleton-mt" />
        </div>

        {/* Skeleton Saved Vehicles */}
        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '16px' }}>
          <Skeleton variant="text" width={120} height={20} />
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Skeleton variant="rect" width={100} height={60} borderRadius={8} />
            <Skeleton variant="rect" width={100} height={60} borderRadius={8} />
          </div>
        </div>

        {/* Skeleton Menu Items */}
        <div className="profile-menu">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="menu-item" style={{ padding: '16px' }}>
              <Skeleton variant="circle" width={22} height={22} />
              <Skeleton variant="text" width="60%" height={18} />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
      id: 'theme',
      icon: <MoonIcon />,
      label: t('profile.appearance', 'Appearance'),
      customRight: <ThemeToggle size="sm" />,
      onClick: null // Toggle handles its own click
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

      {/* Active Subscription Card - shown if user has subscription */}
      {userData?.subscription?.active && (
        <div className="subscription-card">
          <div className="subscription-icon">✦</div>
          <div className="subscription-info">
            <h4>{t('profile.activeSubscription')}</h4>
            <p>{t(`packages.${userData.subscription.package}.name`)}</p>
            <span className="subscription-renew">
              {t('profile.renewsOn')}: {userData.subscription.renewDate}
            </span>
          </div>
          <span className="subscription-badge">-7.5%</span>
        </div>
      )}

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

      {/* Saved Vehicles */}
      <SavedVehicles />

      {/* Referral Card */}
      <ReferralCard />

      {/* Menu Items */}
      <div className="profile-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${item.onClick ? 'menu-item--clickable' : ''}`}
            onClick={item.onClick || undefined}
            role={item.onClick ? 'button' : undefined}
            tabIndex={item.onClick ? 0 : undefined}
            onKeyDown={item.onClick ? (e) => e.key === 'Enter' && item.onClick() : undefined}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            {item.value && <span className="menu-value">{item.value}</span>}
            {item.customRight ? (
              <span className="menu-custom">{item.customRight}</span>
            ) : (
              <span className="menu-arrow"><ChevronRightIcon /></span>
            )}
          </div>
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
