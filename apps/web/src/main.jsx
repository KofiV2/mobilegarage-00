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
