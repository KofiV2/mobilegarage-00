import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import './StaffLoginPage.css';

const StaffLoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isStaffAuthenticated, staffLogin } = useStaffAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isStaffAuthenticated) {
      navigate('/staff/orders');
    }
  }, [isStaffAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await staffLogin(email, password);

    if (result.success) {
      navigate('/staff/orders');
    } else {
      setError(result.error || t('staff.login.error'));
    }

    setIsLoading(false);
  };

  return (
    <div className="staff-login-page">
      <div className="staff-login-container">
        <div className="staff-login-card">
          <div className="staff-login-header">
            <div className="staff-logo">
              <span className="logo-icon">🚐</span>
              <span className="logo-text">3ON</span>
            </div>
            <h1>{t('staff.login.title')}</h1>
            <p>{t('staff.login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="staff-login-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">{t('staff.login.email')}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('staff.login.emailPlaceholder')}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('staff.login.password')}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('staff.login.passwordPlaceholder')}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner"></span>
                  {t('staff.login.loggingIn')}
                </>
              ) : (
                t('staff.login.submit')
              )}
            </button>
          </form>

          <div className="staff-login-footer">
            <p>{t('staff.login.vehicleAccess')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPage;
