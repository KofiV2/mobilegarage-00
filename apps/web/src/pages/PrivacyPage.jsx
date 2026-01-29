import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './StaticPage.css';

const PrivacyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="static-page">
      <header className="static-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← {t('common.back')}
        </button>
        <h1>{t('privacy.title')}</h1>
      </header>

      <div className="static-content legal-content">
        <p className="last-updated">{t('privacy.lastUpdated')}: January 2026</p>

        <section>
          <h2>{t('privacy.section1Title')}</h2>
          <p>{t('privacy.section1Text')}</p>
        </section>

        <section>
          <h2>{t('privacy.section2Title')}</h2>
          <p>{t('privacy.section2Text')}</p>
          <ul>
            <li>{t('privacy.dataItem1')}</li>
            <li>{t('privacy.dataItem2')}</li>
            <li>{t('privacy.dataItem3')}</li>
            <li>{t('privacy.dataItem4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('privacy.section3Title')}</h2>
          <p>{t('privacy.section3Text')}</p>
        </section>

        <section>
          <h2>{t('privacy.section4Title')}</h2>
          <p>{t('privacy.section4Text')}</p>
        </section>

        <section>
          <h2>{t('privacy.section5Title')}</h2>
          <p>{t('privacy.section5Text')}</p>
          <p>📧 info@3on.ae</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
