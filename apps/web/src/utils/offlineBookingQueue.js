/**
 * Offline Booking Queue
 * Uses IndexedDB to store bookings when offline, syncs when back online
 */

import logger from './logger';

const DB_NAME = '3on-offline';
const DB_VERSION = 1;
const BOOKING_STORE = 'pending-bookings';
const BOOKING_SYNC_TAG = 'booking-sync';

let dbInstance = null;

/**
 * Open IndexedDB connection
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      logger.error('Failed to open IndexedDB', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create pending bookings store
      if (!db.objectStoreNames.contains(BOOKING_STORE)) {
        const store = db.createObjectStore(BOOKING_STORE, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

/**
 * Save booking to offline queue
 * @param {Object} bookingData - The booking data to save
 * @returns {Promise<number>} The offline booking ID
 */
export async function queueBooking(bookingData) {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKING_STORE, 'readwrite');
    const store = tx.objectStore(BOOKING_STORE);
    
    const entry = {
      data: bookingData,
      createdAt: Date.now(),
      status: 'pending',
      attempts: 0,
      lastAttempt: null,
    };
    
    const request = store.add(entry);
    
    request.onerror = () => {
      logger.error('Failed to queue booking', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      const id = request.result;
      logger.info('Booking queued offline', { id });
      
      // Try to trigger background sync if available
      triggerSync();
      
      resolve(id);
    };
  });
}

/**
 * Get all pending bookings
 * @returns {Promise<Array>} List of pending bookings
 */
export async function getPendingBookings() {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKING_STORE, 'readonly');
      const store = tx.objectStore(BOOKING_STORE);
      const index = store.index('status');
      const request = index.getAll('pending');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  } catch (error) {
    logger.error('Failed to get pending bookings', error);
    return [];
  }
}

/**
 * Get count of pending bookings
 * @returns {Promise<number>} Count of pending bookings
 */
export async function getPendingCount() {
  try {
    const bookings = await getPendingBookings();
    return bookings.length;
  } catch {
    return 0;
  }
}

/**
 * Update booking status
 * @param {number} id - Booking ID
 * @param {string} status - New status ('pending', 'syncing', 'synced', 'failed')
 */
export async function updateBookingStatus(id, status, error = null) {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKING_STORE, 'readwrite');
    const store = tx.objectStore(BOOKING_STORE);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const booking = request.result;
      if (!booking) {
        reject(new Error('Booking not found'));
        return;
      }
      
      booking.status = status;
      booking.lastAttempt = Date.now();
      booking.attempts += 1;
      if (error) {
        booking.lastError = error;
      }
      
      const updateRequest = store.put(booking);
      updateRequest.onerror = () => reject(updateRequest.error);
      updateRequest.onsuccess = () => resolve();
    };
  });
}

/**
 * Delete a booking from the queue
 * @param {number} id - Booking ID
 */
export async function deleteBooking(id) {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKING_STORE, 'readwrite');
    const store = tx.objectStore(BOOKING_STORE);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      logger.info('Deleted offline booking', { id });
      resolve();
    };
  });
}

/**
 * Clear all synced bookings
 */
export async function clearSyncedBookings() {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKING_STORE, 'readwrite');
    const store = tx.objectStore(BOOKING_STORE);
    const index = store.index('status');
    const request = index.openCursor('synced');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
}

/**
 * Trigger background sync
 */
export async function triggerSync() {
  if (!('serviceWorker' in navigator)) return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Try background sync API first
    if ('sync' in registration) {
      await registration.sync.register(BOOKING_SYNC_TAG);
      logger.info('Background sync registered');
    } else {
      // Fallback: message service worker directly
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TRIGGER_SYNC',
        });
      }
    }
  } catch (error) {
    logger.warn('Failed to register background sync', error);
  }
}

/**
 * Check if device is online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Subscribe to online/offline events
 * @param {Function} callback - Called with {online: boolean}
 * @returns {Function} Unsubscribe function
 */
export function subscribeToNetworkStatus(callback) {
  const handleOnline = () => callback({ online: true });
  const handleOffline = () => callback({ online: false });
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Call immediately with current status
  callback({ online: navigator.onLine });
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Notify service worker that a booking was synced
 * @param {number} offlineId - The offline booking ID that was synced
 */
export function notifyBookingSynced(offlineId) {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'BOOKING_SYNCED',
      payload: { offlineId },
    });
  }
}

export default {
  queueBooking,
  getPendingBookings,
  getPendingCount,
  updateBookingStatus,
  deleteBooking,
  clearSyncedBookings,
  triggerSync,
  isOnline,
  subscribeToNetworkStatus,
  notifyBookingSynced,
};
