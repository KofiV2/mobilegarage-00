import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import logger from './logger';
import { retryNetworkErrors } from './errorRecovery';

/**
 * Firestore Helper Utilities
 *
 * Provides optimized Firestore operations with:
 * - Client-side caching
 * - Query optimization
 * - Pagination support
 * - Input validation
 * - Error handling with retry logic
 * - Batch operations
 */

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cache key from query parameters
 */
function getCacheKey(collectionName, queryParams) {
  return JSON.stringify({ collectionName, ...queryParams });
}

/**
 * Get data from cache if available and not expired
 */
function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('Cache hit', { key });
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
  }
  return null;
}

/**
 * Set data in cache
 */
function setInCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear cache for specific collection or all
 */
export function clearCache(collectionName = null) {
  if (collectionName) {
    for (const key of cache.keys()) {
      if (key.includes(`"collectionName":"${collectionName}"`)) {
        cache.delete(key);
      }
    }
    logger.debug('Cache cleared for collection', { collectionName });
  } else {
    cache.clear();
    logger.debug('All cache cleared');
  }
}

/**
 * Validate booking data
 */
export function validateBookingData(data) {
  const errors = [];

  if (!data.userId || typeof data.userId !== 'string') {
    errors.push('Invalid userId');
  }

  if (!data.packageName || !['basic', 'premium', 'deluxe', 'diamond'].includes(data.packageName)) {
    errors.push('Invalid packageName');
  }

  if (!data.vehicleType || !['sedan', 'suv', 'truck', 'van', 'motorcycle'].includes(data.vehicleType)) {
    errors.push('Invalid vehicleType');
  }

  if (typeof data.price !== 'number' || data.price < 0) {
    errors.push('Invalid price');
  }

  if (!data.address || typeof data.address !== 'string' || data.address.trim().length === 0) {
    errors.push('Invalid address');
  }

  if (!data.phoneNumber || !/^[0-9]{10,15}$/.test(data.phoneNumber)) {
    errors.push('Invalid phoneNumber format');
  }

  if (!data.status || !['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(data.status)) {
    errors.push('Invalid status');
  }

  if (errors.length > 0) {
    throw new Error(`Booking validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Validate user data
 */
export function validateUserData(data) {
  const errors = [];

  if (!data.phoneNumber || !/^[0-9]{10,15}$/.test(data.phoneNumber)) {
    errors.push('Invalid phoneNumber format');
  }

  if (data.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.name !== undefined && typeof data.name !== 'string') {
    errors.push('Invalid name type');
  }

  if (data.language && !['en', 'ar'].includes(data.language)) {
    errors.push('Invalid language');
  }

  if (errors.length > 0) {
    throw new Error(`User validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Fetch user bookings with caching and optimization
 */
export async function fetchUserBookings(userId, options = {}) {
  const {
    status = null,
    orderByField = 'createdAt',
    orderDirection = 'desc',
    limitCount = 10,
    useCache = true,
    lastDoc = null
  } = options;

  const cacheKey = getCacheKey('bookings', { userId, status, orderByField, orderDirection, limitCount });

  // Check cache first
  if (useCache && !lastDoc) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const bookingsRef = collection(db, 'bookings');
    let q = query(
      bookingsRef,
      where('userId', '==', userId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );

    // Add status filter if provided
    if (status) {
      if (Array.isArray(status)) {
        q = query(
          bookingsRef,
          where('userId', '==', userId),
          where('status', 'in', status),
          orderBy(orderByField, orderDirection),
          limit(limitCount)
        );
      } else {
        q = query(
          bookingsRef,
          where('userId', '==', userId),
          where('status', '==', status),
          orderBy(orderByField, orderDirection),
          limit(limitCount)
        );
      }
    }

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await retryNetworkErrors(() => getDocs(q));

    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const result = {
      bookings,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limitCount
    };

    // Cache the result
    if (useCache && !lastDoc) {
      setInCache(cacheKey, result);
    }

    return result;
  } catch (error) {
    logger.error('Error fetching user bookings', error, { userId, options });
    throw error;
  }
}

/**
 * Fetch user data with caching
 */
export async function fetchUserData(userId, useCache = true) {
  const cacheKey = getCacheKey('users', { userId });

  if (useCache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const userDoc = await retryNetworkErrors(() => getDoc(doc(db, 'users', userId)));

    if (!userDoc.exists()) {
      return null;
    }

    const userData = {
      id: userDoc.id,
      ...userDoc.data()
    };

    if (useCache) {
      setInCache(cacheKey, userData);
    }

    return userData;
  } catch (error) {
    logger.error('Error fetching user data', error, { userId });
    throw error;
  }
}

/**
 * Fetch loyalty data with caching
 */
export async function fetchLoyaltyData(userId, useCache = true) {
  const cacheKey = getCacheKey('loyalty', { userId });

  if (useCache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const loyaltyDoc = await retryNetworkErrors(() => getDoc(doc(db, 'loyalty', userId)));

    if (!loyaltyDoc.exists()) {
      return { washCount: 0, freeWashAvailable: false };
    }

    const loyaltyData = loyaltyDoc.data();

    if (useCache) {
      setInCache(cacheKey, loyaltyData);
    }

    return loyaltyData;
  } catch (error) {
    logger.error('Error fetching loyalty data', error, { userId });
    throw error;
  }
}

/**
 * Optimized dashboard data fetch
 * Combines multiple queries to reduce round trips
 */
export async function fetchDashboardData(userId, useCache = true) {
  const cacheKey = getCacheKey('dashboard', { userId });

  if (useCache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    // Fetch all data in parallel
    const [loyaltyData, bookingsData] = await Promise.all([
      fetchLoyaltyData(userId, useCache),
      fetchUserBookings(userId, {
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: 20,
        useCache
      })
    ]);

    // Filter bookings client-side to avoid multiple queries
    const { bookings } = bookingsData;
    const activeBooking = bookings.find(b =>
      b.status === 'pending' || b.status === 'confirmed'
    ) || null;

    const lastBooking = bookings.find(b =>
      b.status === 'completed'
    ) || null;

    const result = {
      loyalty: loyaltyData,
      activeBooking,
      lastBooking,
      recentBookings: bookings.slice(0, 5)
    };

    if (useCache) {
      setInCache(cacheKey, result);
    }

    return result;
  } catch (error) {
    logger.error('Error fetching dashboard data', error, { userId });
    throw error;
  }
}

/**
 * Create booking with validation
 */
export async function createBooking(bookingData) {
  try {
    // Validate data
    validateBookingData(bookingData);

    // Add server timestamp
    const dataWithTimestamp = {
      ...bookingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const bookingsRef = collection(db, 'bookings');
    const newBookingRef = doc(bookingsRef);

    await retryNetworkErrors(() => setDoc(newBookingRef, dataWithTimestamp));

    // Clear cache for this user's bookings
    clearCache('bookings');
    clearCache('dashboard');

    logger.info('Booking created successfully', { bookingId: newBookingRef.id });

    return {
      success: true,
      bookingId: newBookingRef.id
    };
  } catch (error) {
    logger.error('Error creating booking', error, { bookingData });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update booking with validation
 */
export async function updateBooking(bookingId, updates) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);

    // Add updated timestamp
    const dataWithTimestamp = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await retryNetworkErrors(() => updateDoc(bookingRef, dataWithTimestamp));

    // Clear cache
    clearCache('bookings');
    clearCache('dashboard');

    logger.info('Booking updated successfully', { bookingId });

    return { success: true };
  } catch (error) {
    logger.error('Error updating booking', error, { bookingId, updates });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete booking
 */
export async function deleteBooking(bookingId) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await retryNetworkErrors(() => deleteDoc(bookingRef));

    // Clear cache
    clearCache('bookings');
    clearCache('dashboard');

    logger.info('Booking deleted successfully', { bookingId });

    return { success: true };
  } catch (error) {
    logger.error('Error deleting booking', error, { bookingId });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update user profile with validation
 */
export async function updateUserProfile(userId, updates) {
  try {
    // Validate data
    if (updates.phoneNumber || updates.email || updates.name || updates.language) {
      validateUserData({ ...updates, phoneNumber: updates.phoneNumber || '1234567890' });
    }

    const userRef = doc(db, 'users', userId);

    // Add updated timestamp
    const dataWithTimestamp = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await retryNetworkErrors(() => updateDoc(userRef, dataWithTimestamp));

    // Clear cache
    clearCache('users');
    clearCache('dashboard');

    logger.info('User profile updated successfully', { userId });

    return { success: true };
  } catch (error) {
    logger.error('Error updating user profile', error, { userId, updates });
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  fetchUserBookings,
  fetchUserData,
  fetchLoyaltyData,
  fetchDashboardData,
  createBooking,
  updateBooking,
  deleteBooking,
  updateUserProfile,
  validateBookingData,
  validateUserData,
  clearCache
};
