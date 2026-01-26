import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import WhatsAppButton, { WhatsAppFloatingButton } from '../components/WhatsAppButton';
import './HomePage.css';

const WHATSAPP_NUMBER = '9710554995611';

const HomePage = () => {
  const { t, i18n } = useTranslation();

  const packages = [
    {
      id: 'platinum',
      name: t('packages.platinum.name'),
      icon: '🥈',
      sedanPrice: 45,
      suvPrice: 50,
      features: [
        t('packages.platinum.feature1'),
        t('packages.platinum.feature2'),
        t('packages.platinum.feature3'),
      ],
      available: true,
      color: '#E5E4E2'
    },
    {
      id: 'titanium',
      name: t('packages.titanium.name'),
      icon: '🏆',
      sedanPrice: 75,
      suvPrice: 80,
      features: [
        t('packages.titanium.feature1'),
        t('packages.titanium.feature2'),
        t('packages.titanium.feature3'),
        t('packages.titanium.feature4'),
      ],
      available: true,
      popular: true,
      color: '#878681'
    },
    {
      id: 'diamond',
      name: t('packages.diamond.name'),
      icon: '💎',
      sedanPrice: null,
      suvPrice: null,
      features: [
        t('packages.diamond.feature1'),
        t('packages.diamond.feature2'),
        t('packages.diamond.feature3'),
        t('packages.diamond.feature4'),
        t('packages.diamond.feature5'),
      ],
      available: false,
      comingSoon: true,
      color: '#B9F2FF'
    }
  ];

  const getWhatsAppUrl = (message) => {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const getBookingMessage = (packageName, vehicleType, price) => {
    if (i18n.language === 'ar') {
      return `مرحباً! أود حجز باقة ${packageName} لسيارتي (${vehicleType}) - ${price} درهم`;
    }
    return `Hi! I'd like to book the ${packageName} package for my ${vehicleType} - AED ${price}`;
  };

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-container">
          <div className="header-logo">
            <span className="logo-icon">🚗</span>
            <span className="logo-text">3ON Mobile Carwash</span>
          </div>
          <div className="header-actions">
            <LanguageSwitcher />
            <a
              href={getWhatsAppUrl(i18n.language === 'ar' ? 'مرحباً!' : 'Hello!')}
              className="header-contact"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-icon">📞</span>
              <span className="contact-text">0554995611</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              {t('hero.title')} <br />
              <span className="highlight">{t('hero.highlight')}</span>
            </h1>
            <p className="hero-description">
              {t('hero.description')}
            </p>
            <div className="hero-actions">
              <WhatsAppButton variant="light" size="large" />
            </div>
            <div className="hero-subtext">
              {t('hero.subtext')}
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-badge">
              <span className="badge-icon">⭐</span>
              <div className="badge-content">
                <div className="badge-rating">4.9/5</div>
                <div className="badge-text">{t('hero.ratedService')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="services-container">
          <h2 className="section-title">{t('services.title')}</h2>
          <p className="section-subtitle">{t('services.subtitle')}</p>

          <div className="packages-grid">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`package-card ${pkg.popular ? 'popular' : ''} ${pkg.comingSoon ? 'coming-soon' : ''}`}
              >
                {pkg.popular && (
                  <div className="popular-badge">{t('packages.mostPopular')}</div>
                )}
                {pkg.comingSoon && (
                  <div className="coming-soon-badge">{t('packages.comingSoon')}</div>
                )}

                <div className="package-header">
                  <span className="package-icon">{pkg.icon}</span>
                  <h3 className="package-name">{pkg.name}</h3>
                </div>

                <div className="package-pricing">
                  {pkg.available ? (
                    <>
                      <div className="price-row">
                        <span className="vehicle-type">{t('packages.sedan')}</span>
                        <span className="price">AED {pkg.sedanPrice}</span>
                      </div>
                      <div className="price-row">
                        <span className="vehicle-type">{t('packages.suv')}</span>
                        <span className="price">AED {pkg.suvPrice}</span>
                      </div>
                    </>
                  ) : (
                    <div className="price-coming-soon">
                      {t('packages.priceTBA')}
                    </div>
                  )}
                </div>

                <ul className="package-features">
                  {pkg.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {pkg.available ? (
                  <div className="package-actions">
                    <a
                      href={getWhatsAppUrl(getBookingMessage(pkg.name, t('packages.sedan'), pkg.sedanPrice))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="book-btn book-btn-sedan"
                    >
                      <svg className="whatsapp-icon-small" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {t('packages.bookSedan')}
                    </a>
                    <a
                      href={getWhatsAppUrl(getBookingMessage(pkg.name, t('packages.suv'), pkg.suvPrice))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="book-btn book-btn-suv"
                    >
                      <svg className="whatsapp-icon-small" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {t('packages.bookSuv')}
                    </a>
                  </div>
                ) : (
                  <div className="package-actions">
                    <button className="book-btn book-btn-disabled" disabled>
                      {t('packages.comingSoon')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="contact-container">
          <h2 className="section-title">{t('contact.title')}</h2>
          <p className="section-subtitle">{t('contact.subtitle')}</p>

          <div className="contact-grid">
            <a
              href={getWhatsAppUrl(i18n.language === 'ar' ? 'مرحباً! أود حجز خدمة غسيل سيارات' : 'Hi! I would like to book a car wash service')}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card whatsapp-card"
            >
              <div className="contact-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h3>{t('contact.whatsapp')}</h3>
              <p>0554995611</p>
            </a>

            <a href="tel:+9710554995611" className="contact-card phone-card">
              <div className="contact-icon">📞</div>
              <h3>{t('contact.phone')}</h3>
              <p>0554995611</p>
            </a>

            <div className="contact-card location-card">
              <div className="contact-icon">📍</div>
              <h3>{t('contact.location')}</h3>
              <p>{t('contact.locationText')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">🚗 3ON Mobile Carwash</span>
              <p className="footer-description">
                {t('footer.description')}
              </p>
            </div>
            <div className="footer-contact">
              <h4>{t('footer.contactUs')}</h4>
              <p>📞 0554995611</p>
              <a
                href={getWhatsAppUrl(i18n.language === 'ar' ? 'مرحباً!' : 'Hello!')}
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 3ON Mobile Carwash. {t('footer.rights')}</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <WhatsAppFloatingButton />
    </div>
  );
};

export default HomePage;
