/**
 * Booking status constants and flow definitions
 * Shared across web, mobile, and Cloud Functions
 */
import type { BookingStatus } from '../types';

/**
 * Ordered list of booking statuses representing the normal progression
 */
export const STATUS_ORDER: BookingStatus[] = [
  'pending',
  'confirmed',
  'on_the_way',
  'in_progress',
  'completed',
];

/**
 * Status flow - which statuses can transition to which
 */
export const STATUS_FLOW: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['on_the_way', 'cancelled'],
  on_the_way: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Active statuses (booking is in progress or upcoming)
 */
export const ACTIVE_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'on_the_way',
  'in_progress',
];

/**
 * Terminal statuses (booking is finished)
 */
export const TERMINAL_STATUSES: BookingStatus[] = ['completed', 'cancelled'];

/**
 * Status colors for UI display
 */
export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  on_the_way: '#8b5cf6',
  in_progress: '#06b6d4',
  completed: '#10b981',
  cancelled: '#ef4444',
};

/**
 * Status icons for UI display
 */
export const STATUS_ICONS: Record<BookingStatus, string> = {
  pending: '⏳',
  confirmed: '✅',
  on_the_way: '🚗',
  in_progress: '🔄',
  completed: '✨',
  cancelled: '❌',
};

/**
 * Check if a status transition is valid
 */
export const isValidTransition = (
  from: BookingStatus,
  to: BookingStatus
): boolean => {
  return STATUS_FLOW[from]?.includes(to) ?? false;
};

/**
 * Get the next valid status in the normal progression
 */
export const getNextStatus = (
  current: BookingStatus
): BookingStatus | null => {
  const currentIndex = STATUS_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex >= STATUS_ORDER.length - 1) {
    return null;
  }
  return STATUS_ORDER[currentIndex + 1];
};

/**
 * Check if a booking is in an active (non-terminal) state
 */
export const isActiveStatus = (status: BookingStatus): boolean => {
  return ACTIVE_STATUSES.includes(status);
};

/**
 * Time slots generation for booking
 * Business hours: 12 PM to 12 AM (midnight)
 */
export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 12; hour < 24; hour++) {
    const formattedHour = hour.toString().padStart(2, '0');
    slots.push(`${formattedHour}:00`);
  }
  return slots;
};

export const TIME_SLOTS = generateTimeSlots();

/**
 * Monthly subscription discount percentage
 */
export const MONTHLY_SUBSCRIPTION_DISCOUNT = 0.075; // 7.5%
