import React, { useState, useEffect } from 'react';
import './ErrorNotification.css';

let globalNotificationHandler = null;

export const showErrorNotification = (message, duration = 5000) => {
  if (globalNotificationHandler) {
    globalNotificationHandler(message, duration);
  }
};

export const showSuccessNotification = (message, duration = 3000) => {
  if (globalNotificationHandler) {
    globalNotificationHandler(message, duration, 'success');
  }
};

const ErrorNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    globalNotificationHandler = (message, duration, type = 'error') => {
      const id = Date.now();
      const newNotification = { id, message, type };

      setNotifications(prev => [...prev, newNotification]);

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    };

    return () => {
      globalNotificationHandler = null;
    };
  }, []);

  const handleClose = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          <div className="notification-icon">
            {notification.type === 'error' ? 'L' : ''}
          </div>
          <div className="notification-message">{notification.message}</div>
          <button
            className="notification-close"
            onClick={() => handleClose(notification.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ErrorNotification;
