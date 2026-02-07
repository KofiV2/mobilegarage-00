/**
 * InstallPrompt Component
 * Shows a banner prompting users to install the PWA
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { usePWA } from '../hooks/usePWA';
import './InstallPrompt.css';

function InstallPrompt({ delay = 30000, showOnce = true }) {
  const { t } = useTranslation();
  const { 
    isInstallable, 
    isInstalled, 
    promptInstall, 
    isIOSSafari 
  } = usePWA();
  
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  // Check if user has dismissed before
  useEffect(() => {
    if (showOnce) {
      const wasDismissed = localStorage.getItem('pwa-install-dismissed');
      if (wasDismissed) {
        setDismissed(true);
      }
    }
  }, [showOnce]);
  
  // Show prompt after delay
  useEffect(() => {
    if (isInstalled || dismissed) return;
    
    const shouldShow = isInstallable || isIOSSafari();
    
    if (shouldShow) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isIOSSafari, delay, dismissed]);
  
  const handleInstall = async () => {
    if (isIOSSafari()) {
      setShowIOSGuide(true);
    } else {
      const accepted = await promptInstall();
      if (accepted) {
        setVisible(false);
      }
    }
  };
  
  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (showOnce) {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };
  
  const handleCloseGuide = () => {
    setShowIOSGuide(false);
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };
  
  if (!visible || isInstalled) return null;
  
  // iOS Safari guide modal
  if (showIOSGuide) {
    return (
      <div className="install-prompt-overlay" onClick={handleCloseGuide}>
        <div className="install-prompt-ios-guide" onClick={(e) => e.stopPropagation()}>
          <button className="install-prompt-close" onClick={handleCloseGuide}>
            ✕
          </button>
          
          <div className="ios-guide-icon">📱</div>
          <h3>{t('pwa.iosTitle', 'Add to Home Screen')}</h3>
          
          <div className="ios-guide-steps">
            <div className="ios-step">
              <span className="ios-step-number">1</span>
              <span className="ios-step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L12 15M12 2L7 7M12 2L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 15V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              <span>{t('pwa.iosStep1', 'Tap the Share button')}</span>
            </div>
            
            <div className="ios-step">
              <span className="ios-step-number">2</span>
              <span className="ios-step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              <span>{t('pwa.iosStep2', 'Scroll and tap "Add to Home Screen"')}</span>
            </div>
            
            <div className="ios-step">
              <span className="ios-step-number">3</span>
              <span className="ios-step-icon">✓</span>
              <span>{t('pwa.iosStep3', 'Tap "Add" to confirm')}</span>
            </div>
          </div>
          
          <button className="install-prompt-btn primary" onClick={handleCloseGuide}>
            {t('pwa.gotIt', 'Got it!')}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="install-prompt-banner">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">
          <img src="/logo-192x192.png" alt="3ON Carwash" />
        </div>
        
        <div className="install-prompt-text">
          <h4>{t('pwa.installTitle', 'Install 3ON Carwash')}</h4>
          <p>{t('pwa.installDescription', 'Add to home screen for faster access and offline support')}</p>
        </div>
      </div>
      
      <div className="install-prompt-actions">
        <button className="install-prompt-btn secondary" onClick={handleDismiss}>
          {t('pwa.notNow', 'Not now')}
        </button>
        <button className="install-prompt-btn primary" onClick={handleInstall}>
          {t('pwa.install', 'Install')}
        </button>
      </div>
    </div>
  );
}

InstallPrompt.propTypes = {
  delay: PropTypes.number,
  showOnce: PropTypes.bool,
};

export default InstallPrompt;
