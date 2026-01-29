import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BookingWizard from '../components/BookingWizard';
import './ServicesPage.css';

const PACKAGES = [
  {
    id: 'platinum',
    icon: '🥈',
    sedanPrice: 45,
    suvPrice: 50,
    popular: false
  },
  {
    id: 'titanium',
    icon: '🏆',
    sedanPrice: 75,
    suvPrice: 80,
    popular: true
  },
  {
    id: 'diamond',
    icon: '💎',
    sedanPrice: null,
    suvPrice: null,
    comingSoon: true
  }
];

const ServicesPage = () => {
  const { t } = useTranslation();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div className="services-page">
      <header className="services-header">
        <h1>{t('services.title')}</h1>
        <p>{t('services.subtitle')}</p>
      </header>

      <div className="packages-list">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`package-item ${pkg.popular ? 'popular' : ''} ${pkg.comingSoon ? 'coming-soon' : ''}`}
          >
            {pkg.popular && (
              <span className="popular-tag">{t('packages.mostPopular')}</span>
            )}
            {pkg.comingSoon && (
              <span className="coming-soon-tag">{t('packages.comingSoon')}</span>
            )}

            <div className="package-icon">{pkg.icon}</div>
            <div className="package-info">
              <h3 className="package-name">{t(`packages.${pkg.id}.name`)}</h3>
              {!pkg.comingSoon ? (
                <div className="package-prices">
                  <span className="price-item">
                    <span className="vehicle">{t('packages.sedan')}</span>
                    <span className="price">AED {pkg.sedanPrice}</span>
                  </span>
                  <span className="price-divider">|</span>
                  <span className="price-item">
                    <span className="vehicle">{t('packages.suv')}</span>
                    <span className="price">AED {pkg.suvPrice}</span>
                  </span>
                </div>
              ) : (
                <p className="coming-soon-text">{t('packages.priceTBA')}</p>
              )}
            </div>

            {!pkg.comingSoon && (
              <button
                className="book-package-btn"
                onClick={() => setIsWizardOpen(true)}
              >
                {t('services.bookNow')}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="services-features">
        <h2>{t('services.whyChooseUs')}</h2>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">🏠</span>
            <h4>{t('services.doorstepTitle')}</h4>
            <p>{t('services.doorstepDesc')}</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌿</span>
            <h4>{t('services.ecoTitle')}</h4>
            <p>{t('services.ecoDesc')}</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⭐</span>
            <h4>{t('services.qualityTitle')}</h4>
            <p>{t('services.qualityDesc')}</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔄</span>
            <h4>{t('services.subscriptionTitle')}</h4>
            <p>{t('services.subscriptionDesc')}</p>
          </div>
        </div>
      </div>

      <BookingWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
};

export default ServicesPage;
