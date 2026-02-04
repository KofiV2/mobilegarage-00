import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingWizard from '../components/BookingWizard';
import './ServicesPage.css';

const PACKAGES = [
  {
    id: 'platinum',
    icon: '🥈',
    sedanPrice: 45,
    suvPrice: 50,
    popular: false,
    featureCount: 3
  },
  {
    id: 'titanium',
    icon: '🏆',
    sedanPrice: 75,
    suvPrice: 80,
    popular: true,
    featureCount: 8
  },
  {
    id: 'diamond',
    icon: '💎',
    sedanPrice: 110,
    suvPrice: 120,
    popular: false,
    featureCount: 3
  }
];

const ServicesPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);

  // Check if we're coming from a reschedule action
  useEffect(() => {
    if (location.state?.reschedule) {
      setRescheduleData({
        bookingId: location.state.bookingId,
        vehicleType: location.state.vehicleType,
        package: location.state.package,
        price: location.state.price
      });
      setIsWizardOpen(true);
      // Clear the navigation state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setRescheduleData(null);
  };

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
              <ul className="package-features">
                {Array.from({ length: pkg.featureCount }, (_, i) => (
                  <li key={i}>
                    <span className="feature-check">✓</span>
                    {t(`packages.${pkg.id}.feature${i + 1}`)}
                  </li>
                ))}
              </ul>
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
        onClose={handleWizardClose}
        rescheduleData={rescheduleData}
      />
    </div>
  );
};

export default ServicesPage;
