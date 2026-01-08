import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>{t('profile.title')}</h1>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '10px', marginTop: '1rem' }}>
        <p><strong>{t('auth.firstName')}:</strong> {user?.firstName} {user?.lastName}</p>
        <p><strong>{t('auth.email')}:</strong> {user?.email}</p>
        <p><strong>{t('auth.phone')}:</strong> {user?.phone}</p>
      </div>
    </div>
  );
};

export default Profile;
