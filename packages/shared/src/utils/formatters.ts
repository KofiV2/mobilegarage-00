/**
 * Shared formatting utilities
 * Used across web, mobile, and Cloud Functions
 */
import type { BookingStatus } from '../types';
import { STATUS_COLORS, STATUS_ICONS } from '../constants/status';

/**
 * Format a date string for display
 */
export const formatDate = (
  dateStr: string | Date,
  locale: string = 'en-US'
): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return String(dateStr);

  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a time string for display (24h -> 12h)
 */
export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const [hourStr, minute] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return timeStr;

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute || '00'} ${period}`;
};

/**
 * Format price in AED
 */
export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return 'N/A';
  return `AED ${price.toFixed(0)}`;
};

/**
 * Format price with decimals
 */
export const formatPriceDetailed = (
  price: number | null | undefined
): string => {
  if (price === null || price === undefined) return 'N/A';
  return `AED ${price.toFixed(2)}`;
};

/**
 * Get display color for a booking status
 */
export const getStatusColor = (status: BookingStatus): string => {
  return STATUS_COLORS[status] || '#6b7280';
};

/**
 * Get display icon for a booking status
 */
export const getStatusIcon = (status: BookingStatus): string => {
  return STATUS_ICONS[status] || '❓';
};

/**
 * Format a booking status for display
 */
export const formatStatus = (status: BookingStatus): string => {
  const labels: Record<BookingStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    on_the_way: 'On the Way',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
};

/**
 * Format a phone number for display (UAE format)
 */
export const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 9 && digits.startsWith('5')) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }

  if (digits.length >= 12 && digits.startsWith('971')) {
    const local = digits.slice(3);
    return `+971 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }

  return phone;
};

/**
 * Format vehicle type for display
 */
export const formatVehicleType = (
  type: string,
  size?: string | null
): string => {
  const typeLabels: Record<string, string> = {
    sedan: 'Sedan',
    suv: 'SUV',
    motorcycle: 'Motorcycle',
    caravan: 'Caravan',
    boat: 'Boat',
  };

  const sizeLabels: Record<string, string> = {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
  };

  const typeLabel = typeLabels[type] || type;
  if (size && sizeLabels[size]) {
    return `${typeLabel} (${sizeLabels[size]})`;
  }
  return typeLabel;
};

/**
 * Format package name for display
 */
export const formatPackageName = (packageId: string): string => {
  const labels: Record<string, string> = {
    platinum: 'Platinum',
    titanium: 'Titanium',
    diamond: 'Diamond',
  };
  return labels[packageId] || packageId;
};
