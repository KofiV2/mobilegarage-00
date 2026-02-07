/**
 * useOfflineBooking Hook
 * Manages offline booking queue and sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  queueBooking,
  getPendingBookings,
  updateBookingStatus,
  deleteBooking,
  triggerSync,
  isOnline,
  subscribeToNetworkStatus,
  notifyBookingSynced,
} from '../utils/offlineBookingQueue';
import logger from '../utils/logger';

/**
 * Hook to manage offline booking queue
 * @returns {Object} Offline booking state and actions
 */
export function useOfflineBooking() {
  const [online, setOnline] = useState(isOnline());
  const [pendingBookings, setPendingBookings] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);
  
  // Subscribe to network status
  useEffect(() => {
    const unsubscribe = subscribeToNetworkStatus(({ online }) => {
      setOnline(online);
      
      // Auto-sync when coming back online
      if (online) {
        syncPendingBookings();
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Load pending bookings on mount
  useEffect(() => {
    loadPendingBookings();
  }, []);
  
  // Listen for sync messages from service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    const handleMessage = async (event) => {
      const { type, booking, offlineId } = event.data || {};
      
      if (type === 'SYNC_BOOKING' && booking && offlineId) {
        // Service worker is asking us to sync a booking
        await syncSingleBooking(offlineId, booking);
      }
    };
    
    navigator.serviceWorker.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);
  
  /**
   * Load pending bookings from IndexedDB
   */
  const loadPendingBookings = useCallback(async () => {
    try {
      const bookings = await getPendingBookings();
      setPendingBookings(bookings);
    } catch (error) {
      logger.error('Failed to load pending bookings', error);
    }
  }, []);
  
  /**
   * Submit a booking (online or queue offline)
   * @param {Object} bookingData - The booking data
   * @param {Object} options - Options including userId
   * @returns {Promise<{success: boolean, bookingId?: string, offlineId?: number, isOffline?: boolean}>}
   */
  const submitBooking = useCallback(async (bookingData, { userId }) => {
    if (online && db) {
      // Online: submit directly to Firestore
      try {
        const bookingsRef = collection(db, 'bookings');
        const docRef = await addDoc(bookingsRef, {
          ...bookingData,
          userId,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
        
        logger.info('Booking submitted online', { bookingId: docRef.id });
        
        return {
          success: true,
          bookingId: docRef.id,
          isOffline: false,
        };
      } catch (error) {
        logger.error('Online booking failed, queuing offline', error);
        // Fall through to offline queue
      }
    }
    
    // Offline: queue for later sync
    try {
      const offlineId = await queueBooking({
        ...bookingData,
        userId,
        status: 'pending',
      });
      
      // Refresh pending list
      await loadPendingBookings();
      
      return {
        success: true,
        offlineId,
        isOffline: true,
      };
    } catch (error) {
      logger.error('Failed to queue booking', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }, [online, loadPendingBookings]);
  
  /**
   * Sync a single booking to Firestore
   */
  const syncSingleBooking = useCallback(async (offlineId, bookingData) => {
    if (!db) return false;
    
    try {
      await updateBookingStatus(offlineId, 'syncing');
      
      const bookingsRef = collection(db, 'bookings');
      const docRef = await addDoc(bookingsRef, {
        ...bookingData,
        createdAt: serverTimestamp(),
        syncedFromOffline: true,
        originalOfflineId: offlineId,
      });
      
      // Delete from offline queue
      await deleteBooking(offlineId);
      
      // Notify service worker
      notifyBookingSynced(offlineId);
      
      // Refresh pending list
      await loadPendingBookings();
      
      logger.info('Offline booking synced', { offlineId, bookingId: docRef.id });
      
      return true;
    } catch (error) {
      logger.error('Failed to sync booking', { offlineId, error });
      await updateBookingStatus(offlineId, 'failed', error.message);
      return false;
    }
  }, [loadPendingBookings]);
  
  /**
   * Sync all pending bookings
   */
  const syncPendingBookings = useCallback(async () => {
    if (!online || syncInProgress.current) return;
    
    syncInProgress.current = true;
    setIsSyncing(true);
    
    try {
      const bookings = await getPendingBookings();
      
      if (bookings.length === 0) {
        return;
      }
      
      logger.info(`Syncing ${bookings.length} pending bookings`);
      
      let synced = 0;
      for (const booking of bookings) {
        const success = await syncSingleBooking(booking.id, booking.data);
        if (success) synced++;
      }
      
      logger.info(`Synced ${synced}/${bookings.length} bookings`);
    } catch (error) {
      logger.error('Sync failed', error);
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
      await loadPendingBookings();
    }
  }, [online, syncSingleBooking, loadPendingBookings]);
  
  /**
   * Manually trigger sync
   */
  const manualSync = useCallback(async () => {
    if (!online) {
      logger.warn('Cannot sync while offline');
      return;
    }
    
    // Try background sync first
    await triggerSync();
    
    // Also try direct sync
    await syncPendingBookings();
  }, [online, syncPendingBookings]);
  
  /**
   * Cancel a pending offline booking
   */
  const cancelPendingBooking = useCallback(async (offlineId) => {
    try {
      await deleteBooking(offlineId);
      await loadPendingBookings();
      return true;
    } catch (error) {
      logger.error('Failed to cancel pending booking', error);
      return false;
    }
  }, [loadPendingBookings]);
  
  return {
    // State
    online,
    pendingBookings,
    pendingCount: pendingBookings.length,
    isSyncing,
    
    // Actions
    submitBooking,
    syncPendingBookings: manualSync,
    cancelPendingBooking,
    refreshPending: loadPendingBookings,
  };
}

export default useOfflineBooking;
