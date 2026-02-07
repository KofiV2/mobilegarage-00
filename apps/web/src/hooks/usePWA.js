/**
 * usePWA Hook
 * Handles PWA installation prompt and service worker updates
 */

import { useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Hook to manage PWA installation and updates
 * @returns {Object} PWA state and actions
 */
export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  
  // Check if app is already installed
  useEffect(() => {
    // Check display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true;
    
    setIsInstalled(isStandalone);
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => {
      setIsInstalled(e.matches);
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      }
    };
  }, []);
  
  // Capture install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      
      // Save the event for later
      setInstallPrompt(e);
      setIsInstallable(true);
      
      logger.info('PWA install prompt captured');
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Handle successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      logger.info('PWA installed successfully');
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  // Monitor service worker updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    const handleControllerChange = () => {
      // New service worker took control - page will reload
      logger.info('New service worker activated');
    };
    
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    
    // Check for updates on the existing registration
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check for waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setHasUpdate(true);
        }
        
        // Listen for new updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setHasUpdate(true);
                logger.info('New service worker update available');
              }
            });
          }
        });
      } catch (error) {
        logger.warn('Failed to check for SW updates', error);
      }
    };
    
    checkForUpdates();
    
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);
  
  /**
   * Trigger the install prompt
   * @returns {Promise<boolean>} Whether installation was accepted
   */
  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      logger.warn('No install prompt available');
      return false;
    }
    
    try {
      // Show the prompt
      installPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await installPrompt.userChoice;
      
      logger.info('Install prompt outcome:', outcome);
      
      // Clear the prompt (can only be used once)
      setInstallPrompt(null);
      setIsInstallable(false);
      
      return outcome === 'accepted';
    } catch (error) {
      logger.error('Install prompt failed', error);
      return false;
    }
  }, [installPrompt]);
  
  /**
   * Apply pending service worker update
   */
  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    
    // Tell the waiting worker to skip waiting
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload the page to get the new version
    window.location.reload();
  }, [waitingWorker]);
  
  /**
   * Dismiss the update notification
   */
  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
  }, []);
  
  /**
   * Check if the browser supports PWA installation
   * @returns {boolean}
   */
  const isPWASupported = useCallback(() => {
    return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
  }, []);
  
  /**
   * Get iOS-specific install instructions
   * @returns {boolean} Whether device is iOS Safari
   */
  const isIOSSafari = useCallback(() => {
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isWebkit = /WebKit/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
    
    return isIOS && isWebkit && isSafari && !isInstalled;
  }, [isInstalled]);
  
  return {
    // State
    isInstallable,
    isInstalled,
    hasUpdate,
    
    // Actions
    promptInstall,
    applyUpdate,
    dismissUpdate,
    
    // Helpers
    isPWASupported,
    isIOSSafari,
  };
}

export default usePWA;
