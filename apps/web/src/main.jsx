import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Validate React is properly loaded before rendering
// This catches duplicate React instance issues early with a user-friendly error
if (!React || typeof React.createElement !== 'function') {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui;padding:20px;text-align:center;background:#f8f9fa;">
        <h1 style="color:#e74c3c;margin-bottom:16px;">Loading Error</h1>
        <p style="color:#666;margin-bottom:24px;">The application failed to load properly.</p>
        <button onclick="location.reload()" style="background:#3498db;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:16px;">
          Refresh Page
        </button>
      </div>
    `;
  }
  throw new Error('React failed to initialize - possible duplicate React instances');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA, push notifications, and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service worker registered:', registration.scope);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour
      
      // Check for updates on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update();
        }
      });
      
      // Handle update found
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New content available, refresh to update');
              // The UpdatePrompt component will handle showing the UI
            }
          });
        }
      });
      
      // Register for periodic background sync (if supported)
      if ('periodicSync' in registration) {
        try {
          await registration.periodicSync.register('check-pending-bookings', {
            minInterval: 24 * 60 * 60 * 1000, // 24 hours
          });
          console.log('[PWA] Periodic sync registered');
        } catch (error) {
          console.log('[PWA] Periodic sync not available:', error.message);
        }
      }
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  });
  
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, count } = event.data || {};
    
    if (type === 'PENDING_COUNT') {
      console.log('[PWA] Pending bookings count:', count);
    }
  });
}
