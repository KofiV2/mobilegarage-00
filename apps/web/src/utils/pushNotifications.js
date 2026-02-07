/**
 * Push Notification Utilities
 * Handles FCM token registration and push subscription
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from '../firebase/config';
import logger from './logger';

let messaging = null;

/**
 * Initialize Firebase Messaging
 * Only works in browsers that support it
 */
function initMessaging() {
  if (messaging) return messaging;
  
  try {
    if (!app) {
      logger.warn('Firebase app not initialized, push notifications unavailable');
      return null;
    }
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    logger.warn('Firebase Messaging not supported in this browser', error);
    return null;
  }
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 
         'PushManager' in window &&
         'Notification' in window;
}

/**
 * Get current notification permission status
 * @returns {'granted' | 'denied' | 'default'}
 */
export function getPermissionStatus() {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestPermission() {
  if (!isPushSupported()) {
    logger.warn('Push notifications not supported');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    logger.info('Notification permission:', permission);
    return permission === 'granted';
  } catch (error) {
    logger.error('Error requesting notification permission', error);
    return false;
  }
}

/**
 * Get FCM token for push notifications
 * Requires notification permission to be granted first
 * @returns {Promise<string | null>} The FCM token or null if unavailable
 */
export async function getFCMToken() {
  if (!isPushSupported()) {
    logger.warn('Push notifications not supported');
    return null;
  }
  
  const permission = getPermissionStatus();
  if (permission !== 'granted') {
    logger.warn('Notification permission not granted');
    return null;
  }
  
  const msg = initMessaging();
  if (!msg) return null;
  
  try {
    // Get the VAPID key from environment
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      logger.warn('VAPID key not configured - add VITE_FIREBASE_VAPID_KEY to .env');
      return null;
    }
    
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    
    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    
    if (token) {
      logger.info('FCM token obtained');
      return token;
    } else {
      logger.warn('No FCM token available');
      return null;
    }
  } catch (error) {
    logger.error('Error getting FCM token', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 * Handles permission request and token retrieval
 * @param {Function} onTokenReceived - Callback when token is received (save to backend)
 * @returns {Promise<{success: boolean, token?: string, error?: string}>}
 */
export async function subscribeToPush(onTokenReceived) {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported on this device' };
  }
  
  // Request permission if not already granted
  const hasPermission = await requestPermission();
  if (!hasPermission) {
    return { success: false, error: 'Notification permission denied' };
  }
  
  // Get FCM token
  const token = await getFCMToken();
  if (!token) {
    return { success: false, error: 'Failed to get push notification token' };
  }
  
  // Call the callback to save the token
  if (onTokenReceived) {
    try {
      await onTokenReceived(token);
    } catch (error) {
      logger.error('Error in token callback', error);
      return { success: false, error: 'Failed to save push token' };
    }
  }
  
  return { success: true, token };
}

/**
 * Set up foreground message handler
 * Shows notification when app is in foreground
 * @param {Function} onNotification - Callback when notification is received
 * @returns {Function | null} Unsubscribe function or null if not supported
 */
export function onForegroundMessage(onNotification) {
  const msg = initMessaging();
  if (!msg) return null;
  
  return onMessage(msg, (payload) => {
    logger.info('Foreground message received', payload);
    
    // Show notification manually since FCM doesn't auto-show in foreground
    if (Notification.permission === 'granted' && payload.notification) {
      const { title, body, icon } = payload.notification;
      new Notification(title, {
        body,
        icon: icon || '/logo-192x192.png',
        data: payload.data,
      });
    }
    
    // Call the callback
    if (onNotification) {
      onNotification(payload);
    }
  });
}

/**
 * Unsubscribe from push notifications
 * Removes the service worker registration
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      logger.info('Unsubscribed from push notifications');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error unsubscribing from push', error);
    return false;
  }
}

export default {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  getFCMToken,
  subscribeToPush,
  onForegroundMessage,
  unsubscribeFromPush,
};
