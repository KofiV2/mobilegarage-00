/**
 * UpdatePrompt Component
 * Shows when a new version of the app is available
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePWA } from '../hooks/usePWA';
import './UpdatePrompt.css';

function UpdatePrompt() {
  const { t } = useTranslation();
  const { hasUpdate, applyUpdate, dismissUpdate } = usePWA();
  
  if (!hasUpdate) return null;
  
  return (
    <div className="update-prompt">
      <div className="update-prompt-content">
        <div className="update-prompt-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-9-9c4.52 0 8.35 3.36 9 7.79" strokeLinecap="round"/>
            <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className="update-prompt-text">
          <h4>{t('pwa.updateTitle', 'Update Available')}</h4>
          <p>{t('pwa.updateDescription', 'A new version is ready to install')}</p>
        </div>
      </div>
      
      <div className="update-prompt-actions">
        <button className="update-prompt-btn secondary" onClick={dismissUpdate}>
          {t('pwa.later', 'Later')}
        </button>
        <button className="update-prompt-btn primary" onClick={applyUpdate}>
          {t('pwa.updateNow', 'Update')}
        </button>
      </div>
    </div>
  );
}

export default UpdatePrompt;
