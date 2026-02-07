import React, { memo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import './ThemeToggle.css';

/**
 * Beautiful animated theme toggle with sun/moon icons
 */
const ThemeToggle = memo(function ThemeToggle({ showLabel = false, size = 'md' }) {
  const { t } = useTranslation();
  const { toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: 'theme-toggle--sm',
    md: 'theme-toggle--md',
    lg: 'theme-toggle--lg'
  };

  return (
    <button
      className={`theme-toggle ${sizeClasses[size]} ${isDark ? 'theme-toggle--dark' : ''}`}
      onClick={toggleTheme}
      aria-label={isDark ? t('theme.switchToLight', 'Switch to light mode') : t('theme.switchToDark', 'Switch to dark mode')}
      title={isDark ? t('theme.switchToLight', 'Switch to light mode') : t('theme.switchToDark', 'Switch to dark mode')}
    >
      <div className="theme-toggle__track">
        <div className="theme-toggle__thumb">
          {/* Sun icon */}
          <svg 
            className="theme-toggle__icon theme-toggle__sun" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          
          {/* Moon icon */}
          <svg 
            className="theme-toggle__icon theme-toggle__moon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </div>
      </div>
      
      {showLabel && (
        <span className="theme-toggle__label">
          {isDark ? t('theme.dark', 'Dark') : t('theme.light', 'Light')}
        </span>
      )}
    </button>
  );
});

export default ThemeToggle;
