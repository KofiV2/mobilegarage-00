import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({
  message = 'Something went wrong',
  details = null,
  onRetry = null,
  type = 'error' // error, warning, info
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <div className={`error-message error-${type}`}>
      <div className="error-icon">{getIcon()}</div>
      <div className="error-content">
        <h3 className="error-title">{message}</h3>
        {details && <p className="error-details">{details}</p>}
        {onRetry && (
          <button className="error-retry-btn" onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
