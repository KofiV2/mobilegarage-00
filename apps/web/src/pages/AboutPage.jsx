import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './StaticPage.css';

const AboutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="static-page">
      <header className="static-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← {t('common.back')}
        </button>
        <h1>{t('about.title')}</h1>
      </header>

      <div className="static-content">
        <div className="about-logo">
          <img
            src="/logo.png"
            alt="3ON Mobile Carwash"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span className="logo-fallback" style={{ display: 'none' }}>🚗</span>
        </div>

        <h2>{t('about.companyName')}</h2>

        <p>{t('about.description1')}</p>
        <p>{t('about.description2')}</p>

        <div className="about-values">
          <h3>{t('about.valuesTitle')}</h3>
          <ul>
            <li>
              <span className="value-icon">🌿</span>
              <div>
                <strong>{t('about.value1Title')}</strong>
                <p>{t('about.value1Desc')}</p>
              </div>
            </li>
            <li>
              <span className="value-icon">⭐</span>
              <div>
                <strong>{t('about.value2Title')}</strong>
                <p>{t('about.value2Desc')}</p>
              </div>
            </li>
            <li>
              <span className="value-icon">🏠</span>
              <div>
                <strong>{t('about.value3Title')}</strong>
                <p>{t('about.value3Desc')}</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="contact-info">
          <h3>{t('about.contactTitle')}</h3>
          <p>📞 055 499 5611</p>
          <p>📧 info@3on.ae</p>
          <p>🌐 www.3on.ae</p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
