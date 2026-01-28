import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

// SVG flags for cross-platform compatibility (Windows doesn't support emoji flags)
const USFlag = () => (
  <svg className="flag-svg" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <g fillRule="evenodd">
      <g strokeWidth="1pt">
        <path fill="#bd3d44" d="M0 0h640v55.3H0zm0 110.7h640v55.3H0zm0 110.6h640v55.3H0zm0 110.7h640v55.3H0zm0 110.6h640V480H0z"/>
        <path fill="#fff" d="M0 55.3h640v55.4H0zm0 110.7h640v55.3H0zm0 110.6h640v55.4H0zm0 110.7h640v55.3H0z"/>
      </g>
      <path fill="#192f5d" d="M0 0h260.4v258.5H0z"/>
      <g fill="#fff">
        <path d="m27 14 3 9H41l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zM53 43l3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zM27 72l3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zM53 101l3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11zm52 0 3 9h11l-8 6 3 9-8-6-8 6 3-9-8-6h11z"/>
      </g>
    </g>
  </svg>
);

const UAEFlag = () => (
  <svg className="flag-svg" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <path fill="#00732f" d="M0 0h640v160H0z"/>
    <path fill="#fff" d="M0 160h640v160H0z"/>
    <path d="M0 320h640v160H0z"/>
    <path fill="red" d="M0 0h220v480H0z"/>
  </svg>
);

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    // Update document direction
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        aria-label="Switch to English"
        title="English"
      >
        <USFlag />
      </button>
      <button
        className={`lang-btn ${i18n.language === 'ar' ? 'active' : ''}`}
        onClick={() => changeLanguage('ar')}
        aria-label="Switch to Arabic"
        title="العربية"
      >
        <UAEFlag />
      </button>
    </div>
  );
};

export default LanguageSwitcher;
