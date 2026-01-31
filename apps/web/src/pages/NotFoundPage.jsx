import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="error-code">404</div>
        <h1 className="error-title">{t('errors.notFound.title', 'Page Not Found')}</h1>
        <p className="error-message">
          {t('errors.notFound.message', 'Sorry, the page you are looking for does not exist or has been moved.')}
        </p>

        <div className="error-actions">
          <button onClick={handleGoHome} className="btn-primary">
            {t('errors.notFound.goHome', 'Go to Homepage')}
          </button>
          <button onClick={handleGoBack} className="btn-secondary">
            {t('errors.notFound.goBack', 'Go Back')}
          </button>
        </div>

        <div className="error-illustration">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" opacity="0.1"/>
            <path d="M70 85C70 79.4772 74.4772 75 80 75C85.5228 75 90 79.4772 90 85C90 90.5228 85.5228 95 80 95C74.4772 95 70 90.5228 70 85Z" fill="currentColor" opacity="0.3"/>
            <path d="M110 85C110 79.4772 114.477 75 120 75C125.523 75 130 79.4772 130 85C130 90.5228 125.523 95 120 95C114.477 95 110 90.5228 110 85Z" fill="currentColor" opacity="0.3"/>
            <path d="M70 125C70 125 85 115 100 115C115 115 130 125 130 125" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
          </svg>
        </div>

        <div className="helpful-links">
          <h3>{t('errors.notFound.helpfulLinks', 'Helpful Links')}</h3>
          <ul>
            <li><a href="/">{t('nav.home', 'Home')}</a></li>
            <li><a href="/services">{t('nav.services', 'Services')}</a></li>
            <li><a href="/track">{t('nav.track', 'Track Order')}</a></li>
            <li><a href="/profile">{t('nav.profile', 'Profile')}</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
