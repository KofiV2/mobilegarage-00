import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import logger from '../utils/logger';
import './EditProfilePage.css';

const EditProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, updateUserProfile } = useAuth();
  const { showToast } = useToast();

  const isNewUser = location.state?.isNewUser;

  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || ''
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(t('editProfile.nameRequired'));
      return;
    }

    // Basic email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t('editProfile.invalidEmail'));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateUserProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        emailVerified: false // Reset verification when email changes
      });

      if (result.success) {
        showToast(t('editProfile.updateSuccess') || 'Profile updated successfully!', 'success');
        navigate(isNewUser ? '/' : '/profile');
      } else {
        const errorMessage = result.error || t('editProfile.updateError');
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      logger.error('Unexpected error updating profile', error, { formData });
      const errorMessage = t('editProfile.updateError');
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-profile-page">
      <header className="edit-header">
        {!isNewUser && (
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ← {t('common.back')}
          </button>
        )}
        <h1>{isNewUser ? t('editProfile.welcomeTitle') : t('editProfile.title')}</h1>
        {isNewUser && <p>{t('editProfile.welcomeSubtitle')}</p>}
      </header>

      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group">
          <label htmlFor="name">
            {t('editProfile.fullName')} <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('editProfile.namePlaceholder')}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">
            {t('editProfile.email')} <span className="optional">({t('common.optional')})</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('editProfile.emailPlaceholder')}
          />
          <p className="input-hint">{t('editProfile.emailHint')}</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className="save-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('common.saving') : (isNewUser ? t('editProfile.getStarted') : t('common.save'))}
        </button>
      </form>
    </div>
  );
};

export default EditProfilePage;
