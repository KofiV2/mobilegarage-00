import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LandingPage.css';

const LandingPage = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: '⚡',
      title: 'Quick Booking',
      description: 'Book your car wash in just 3 taps - fast and easy'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Access from anywhere, anytime on any device'
    },
    {
      icon: '💳',
      title: 'Secure Payment',
      description: 'Multiple payment options with secure processing'
    },
    {
      icon: '🎁',
      title: 'Loyalty Rewards',
      description: 'Earn points with every wash and get rewards'
    },
    {
      icon: '⭐',
      title: 'Quality Service',
      description: 'Professional car wash services you can trust'
    },
    {
      icon: '📊',
      title: 'Track History',
      description: 'View all your bookings and service history'
    }
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-container">
          <div className="header-logo">
            <span className="logo-icon">🚗</span>
            <span className="logo-text">CarWash Pro</span>
          </div>
          <div className="header-actions">
            <LanguageSwitcher />
            <Link to="/login" className="btn-login">
              {t('nav.login')}
            </Link>
            <Link to="/register" className="btn-register">
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Professional Car Wash <br />
              <span className="highlight">At Your Fingertips</span>
            </h1>
            <p className="hero-description">
              Book premium car wash services online. Fast, convenient, and professional service delivered every time.
            </p>
            <div className="hero-actions">
              <Link to="/guest-booking" className="btn-hero-primary">
                Book as Guest
              </Link>
              <Link to="/register" className="btn-hero-secondary">
                Get Started Free
              </Link>
            </div>
            <div className="hero-subtext">
              No account needed • Quick & Easy • 3-minute booking
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-badge">
              <span className="badge-icon">⭐</span>
              <div className="badge-content">
                <div className="badge-rating">4.9/5</div>
                <div className="badge-text">Rated Service</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="section-title">Why Choose Us</h2>
          <p className="section-subtitle">
            Everything you need for a perfect car wash experience
          </p>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-description">
            Join thousands of satisfied customers enjoying premium car wash services
          </p>
          <div className="cta-buttons">
            <Link to="/guest-booking" className="btn-cta btn-cta-primary">
              Book Now as Guest
            </Link>
            <Link to="/register" className="btn-cta btn-cta-secondary">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">🚗 CarWash Pro</span>
              <p className="footer-description">
                Professional car wash booking system
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <Link to="/features">Features</Link>
                <Link to="/pricing">Pricing</Link>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <Link to="/about">About</Link>
                <Link to="/contact">Contact</Link>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <Link to="/help">Help Center</Link>
                <Link to="/privacy">Privacy</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 CarWash Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
