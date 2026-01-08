import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ fullScreen = false, message = 'Loading...', size = 'medium' }) => {
  const containerClass = fullScreen
    ? 'loading-spinner-container fullscreen'
    : 'loading-spinner-container';

  const spinnerClass = `loading-spinner spinner-${size}`;

  return (
    <div className={containerClass}>
      <div className={spinnerClass}></div>
      {message && <div className="loading-message">{message}</div>}
    </div>
  );
};

export default LoadingSpinner;
