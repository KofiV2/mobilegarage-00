import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ServerErrorPage.css';

const ServerErrorPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleReportIssue = () => {
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '9710554995611';
    const message = encodeURIComponent(
      t('errors.serverError.reportMessage', 'I encountered an error on the website. Error: 500 - Internal Server Error')
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="server-error-page">
      <div className="server-error-container">
        <div className="error-code">500</div>
        <h1 className="error-title">{t('errors.serverError.title', 'Internal Server Error')}</h1>
        <p className="error-message">
          {t('errors.serverError.message', 'Oops! Something went wrong on our end. Our team has been notified and we\'re working to fix it.')}
        </p>

        <div className="error-actions">
          <button onClick={handleRefresh} className="btn-primary">
            {t('errors.serverError.refresh', 'Refresh Page')}
          </button>
          <button onClick={handleGoHome} className="btn-secondary">
            {t('errors.serverError.goHome', 'Go to Homepage')}
          </button>
        </div>

        <div className="error-illustration">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" opacity="0.1"/>
            <path d="M100 60V100" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
            <circle cx="100" cy="120" r="4" fill="currentColor" opacity="0.4"/>
            <path d="M60 140L140 60M140 140L60 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2"/>
          </svg>
        </div>

        <div className="error-details">
          <h3>{t('errors.serverError.whatHappened', 'What happened?')}</h3>
          <p>
            {t('errors.serverError.explanation', 'A server error occurred while processing your request. This could be due to temporary server issues or maintenance.')}
          </p>

          <h3>{t('errors.serverError.whatToDo', 'What can you do?')}</h3>
          <ul>
            <li>{t('errors.serverError.tryRefresh', 'Try refreshing the page')}</li>
            <li>{t('errors.serverError.waitFew', 'Wait a few minutes and try again')}</li>
            <li>{t('errors.serverError.clearCache', 'Clear your browser cache')}</li>
            <li>
              <button onClick={handleReportIssue} className="link-button">
                {t('errors.serverError.contactSupport', 'Contact our support team')}
              </button>
            </li>
          </ul>
        </div>

        <div className="helpful-links">
          <h3>{t('errors.serverError.helpfulLinks', 'Helpful Links')}</h3>
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

export default ServerErrorPage;
