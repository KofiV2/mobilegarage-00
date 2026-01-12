import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      className={`theme-toggle ${isDark ? 'dark' : 'light'} ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-slider">
        <span className="theme-icon" role="img" aria-hidden="true">
          {isDark ? '🌙' : '☀️'}
        </span>
      </div>
    </button>
  );
};

export default ThemeToggle;
