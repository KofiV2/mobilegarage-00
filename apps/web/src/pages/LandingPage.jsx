import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="landing-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-content">
          <div className="logo-section">
            <img
              src="/logo.png"
              alt="3ON Mobile Carwash"
              className="landing-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="hero-section">
            <h1 className="landing-title">3ON Mobile Carwash</h1>
            <p className="landing-subtitle">
              Premium car wash services at your doorstep
            </p>
            <p className="landing-description">
              Professional equipment • Eco-friendly products • Your location
            </p>
          </div>

          <div className="cta-section">
            <button
              className="get-started-btn"
              onClick={handleGetStarted}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
