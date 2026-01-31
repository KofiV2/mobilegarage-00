import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useManagerAuth } from '../contexts/ManagerAuthContext';
import './ManagerLoginPage.css';

const ManagerLoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isManagerAuthenticated, managerLogin } = useManagerAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isManagerAuthenticated) {
      navigate('/manager');
    }
  }, [isManagerAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await managerLogin(email, password);

    if (result.success) {
      navigate('/manager');
    } else {
      setError(result.error || t('manager.login.error'));
    }

    setIsLoading(false);
  };

  return (
    <div className="manager-login-page">
      <div className="manager-login-container">
        <div className="manager-login-card">
          <div className="manager-login-header">
            <div className="manager-logo">
              <span className="logo-icon">🚗</span>
              <span className="logo-text">3ON</span>
            </div>
            <h1>{t('manager.login.title')}</h1>
            <p>{t('manager.login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="manager-login-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">{t('manager.login.email')}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('manager.login.emailPlaceholder')}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('manager.login.password')}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('manager.login.passwordPlaceholder')}
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
                  {t('manager.login.loggingIn')}
                </>
              ) : (
                t('manager.login.submit')
              )}
            </button>
          </form>

          <div className="manager-login-footer">
            <p>{t('manager.login.staffOnly')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerLoginPage;
