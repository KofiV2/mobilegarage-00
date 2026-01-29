import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './StaticPage.css';

const TermsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="static-page">
      <header className="static-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← {t('common.back')}
        </button>
        <h1>{t('terms.title')}</h1>
      </header>

      <div className="static-content legal-content">
        <p className="last-updated">{t('terms.lastUpdated')}: January 2026</p>

        <section>
          <h2>{t('terms.section1Title')}</h2>
          <p>{t('terms.section1Text')}</p>
        </section>

        <section>
          <h2>{t('terms.section2Title')}</h2>
          <p>{t('terms.section2Text')}</p>
        </section>

        <section>
          <h2>{t('terms.section3Title')}</h2>
          <p>{t('terms.section3Text')}</p>
        </section>

        <section>
          <h2>{t('terms.section4Title')}</h2>
          <p>{t('terms.section4Text')}</p>
        </section>

        <section>
          <h2>{t('terms.section5Title')}</h2>
          <p>{t('terms.section5Text')}</p>
        </section>

        <section>
          <h2>{t('terms.section6Title')}</h2>
          <p>{t('terms.section6Text')}</p>
          <p>📧 info@3on.ae</p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
