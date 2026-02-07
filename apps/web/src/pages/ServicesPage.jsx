import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingWizard from '../components/BookingWizard';
import { PACKAGES_LIST } from '@3on/shared';
import './ServicesPage.css';

const ServicesPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const bookNowSectionRef = useRef(null);

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

  // Handle package selection - highlight and scroll to book now section
  const handlePackageClick = (pkg) => {
    if (pkg.comingSoon) return;

    setSelectedPackage(pkg.id);

    // Scroll to the book now section after a small delay
    setTimeout(() => {
      bookNowSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  };

  // Handle book now click
  const handleBookNow = () => {
    setIsWizardOpen(true);
  };

  return (
    <div className="services-page">
      <header className="services-header">
        <h1>{t('services.title')}</h1>
        <p>{t('services.subtitle')}</p>
      </header>

      <div className="packages-list">
        {PACKAGES_LIST.map((pkg) => (
          <div
            key={pkg.id}
            className={`package-item ${pkg.popular ? 'popular' : ''} ${pkg.comingSoon ? 'coming-soon' : ''} ${selectedPackage === pkg.id ? 'selected' : ''}`}
            onClick={() => handlePackageClick(pkg)}
          >
            {pkg.popular && (
              <span className="popular-tag">{t('packages.mostPopular')}</span>
            )}
            {pkg.comingSoon && (
              <span className="coming-soon-tag">{t('packages.comingSoon')}</span>
            )}
            {selectedPackage === pkg.id && (
              <span className="selected-tag">✓ {t('services.selected') || 'Selected'}</span>
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
                className="book-package-btn small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPackage(pkg.id);
                  setIsWizardOpen(true);
                }}
              >
                {t('services.bookNow')}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Selected Package Book Now Section */}
      {selectedPackage && (
        <div className="book-now-section" ref={bookNowSectionRef}>
          <div className="selected-package-summary">
            <div className="selected-icon">
              {PACKAGES_LIST.find(p => p.id === selectedPackage)?.icon}
            </div>
            <div className="selected-info">
              <span className="selected-label">{t('services.youSelected') || 'You selected'}</span>
              <h3 className="selected-name">{t(`packages.${selectedPackage}.name`)}</h3>
            </div>
          </div>
          <button className="book-now-btn" onClick={handleBookNow}>
            {t('services.bookNow')} →
          </button>
        </div>
      )}

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
        preSelectedPackage={selectedPackage}
      />
    </div>
  );
};

export default ServicesPage;
