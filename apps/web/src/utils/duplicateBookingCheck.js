import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import logger from './logger';

/**
 * Check for duplicate bookings before creating a new one.
 * 
 * Duplicate conditions:
 * 1. Same user has a pending booking on the same date
 * 2. Same vehicle has a booking within 24 hours
 * 
 * @param {Object} params - Check parameters
 * @param {string} params.userId - The user ID (or 'guest' for guest users)
 * @param {string} params.guestSessionId - Guest session ID (for guest users)
 * @param {string} params.guestPhone - Guest phone number (for guest users)
 * @param {string} params.vehicleType - The vehicle type being booked
 * @param {string} params.vehicleSize - The vehicle size (optional)
 * @param {string} params.date - The booking date (YYYY-MM-DD)
 * @param {string} params.time - The booking time slot
 * @returns {Promise<{hasDuplicate: boolean, duplicateType: string|null, existingBooking: Object|null}>}
 */
export async function checkDuplicateBooking({
  userId,
  guestSessionId,
  guestPhone,
  vehicleType,
  vehicleSize,
  date,
  time,
}) {
  if (!db) {
    logger.warn('Database not available for duplicate check');
    return { hasDuplicate: false, duplicateType: null, existingBooking: null };
  }

  try {
    const bookingsRef = collection(db, 'bookings');
    const pendingStatuses = ['pending', 'confirmed'];
    
    // Build queries based on user type
    let userQuery;
    
    if (userId && userId !== 'guest') {
      // Authenticated user - query by userId
      userQuery = query(
        bookingsRef,
        where('userId', '==', userId),
        where('status', 'in', pendingStatuses)
      );
    } else if (guestPhone) {
      // Guest user with phone - query by guestPhone
      const formattedPhone = guestPhone.startsWith('+971') 
        ? guestPhone 
        : `+971${guestPhone}`;
      userQuery = query(
        bookingsRef,
        where('guestPhone', '==', formattedPhone),
        where('status', 'in', pendingStatuses)
      );
    } else if (guestSessionId) {
      // Guest user with session ID - query by guestSessionId
      userQuery = query(
        bookingsRef,
        where('guestSessionId', '==', guestSessionId),
        where('status', 'in', pendingStatuses)
      );
    } else {
      // No identification - cannot check for duplicates
      logger.warn('No user identification provided for duplicate check');
      return { hasDuplicate: false, duplicateType: null, existingBooking: null };
    }

    const snapshot = await getDocs(userQuery);
    
    if (snapshot.empty) {
      return { hasDuplicate: false, duplicateType: null, existingBooking: null };
    }

    const existingBookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Check 1: Same date booking
    const sameDateBooking = existingBookings.find(booking => booking.date === date);
    if (sameDateBooking) {
      return {
        hasDuplicate: true,
        duplicateType: 'same_date',
        existingBooking: sameDateBooking
      };
    }

    // Check 2: Same vehicle within 24 hours
    const bookingDateTime = parseBookingDateTime(date, time);
    const twentyFourHoursBefore = new Date(bookingDateTime.getTime() - 24 * 60 * 60 * 1000);
    const twentyFourHoursAfter = new Date(bookingDateTime.getTime() + 24 * 60 * 60 * 1000);

    const sameVehicleBooking = existingBookings.find(booking => {
      // Check if same vehicle
      const isSameVehicle = booking.vehicleType === vehicleType && 
        ((!vehicleSize && !booking.vehicleSize) || booking.vehicleSize === vehicleSize);
      
      if (!isSameVehicle) return false;

      // Check if within 24 hours
      const existingDateTime = parseBookingDateTime(booking.date, booking.time);
      return existingDateTime >= twentyFourHoursBefore && existingDateTime <= twentyFourHoursAfter;
    });

    if (sameVehicleBooking) {
      return {
        hasDuplicate: true,
        duplicateType: 'same_vehicle_24h',
        existingBooking: sameVehicleBooking
      };
    }

    return { hasDuplicate: false, duplicateType: null, existingBooking: null };
  } catch (error) {
    logger.error('Error checking for duplicate bookings', error);
    // On error, allow the booking to proceed (fail open)
    return { hasDuplicate: false, duplicateType: null, existingBooking: null };
  }
}

/**
 * Parse a booking date and time into a Date object
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time slot in HH:00 format
 * @returns {Date}
 */
export function parseBookingDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  let hour = parseInt(timeStr.split(':')[0], 10);
  
  // Handle midnight (24:00 -> next day 00:00)
  if (hour === 24) {
    const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0);
    return nextDay;
  }
  
  return new Date(year, month - 1, day, hour, 0, 0);
}

/**
 * Format duplicate type for display
 * @param {string} duplicateType - The duplicate type
 * @param {Object} existingBooking - The existing booking data
 * @param {Function} t - Translation function
 * @returns {Object} - Title and message for the dialog
 */
export function formatDuplicateMessage(duplicateType, existingBooking, t) {
  if (duplicateType === 'same_date') {
    return {
      title: t('duplicateCheck.sameDateTitle', 'Booking Already Exists'),
      message: t('duplicateCheck.sameDateMessage', 
        `You already have a pending booking for ${existingBooking.date}. Do you want to create another booking for this date?`
      ).replace('${date}', existingBooking.date)
    };
  }
  
  if (duplicateType === 'same_vehicle_24h') {
    return {
      title: t('duplicateCheck.sameVehicleTitle', 'Recent Booking Found'),
      message: t('duplicateCheck.sameVehicleMessage',
        `You have a booking for the same vehicle on ${existingBooking.date} at ${existingBooking.time}. Do you want to create another booking within 24 hours?`
      ).replace('${date}', existingBooking.date).replace('${time}', existingBooking.time)
    };
  }

  return {
    title: t('duplicateCheck.genericTitle', 'Duplicate Booking'),
    message: t('duplicateCheck.genericMessage', 'A similar booking already exists. Do you want to proceed?')
  };
}

export default checkDuplicateBooking;
