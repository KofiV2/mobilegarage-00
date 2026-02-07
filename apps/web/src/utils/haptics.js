/**
 * Haptic Feedback Utility
 * Provides tactile feedback on supported devices
 */

// Check if vibration API is available
const supportsVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;

// Vibration patterns (in milliseconds)
const patterns = {
  // Short tap - button press, selections
  tap: [10],
  
  // Light tap - toggle switches, small actions
  light: [5],
  
  // Success - completed action, confirmation
  success: [10, 50, 10],
  
  // Warning - caution needed
  warning: [30, 50, 30],
  
  // Error - something went wrong
  error: [50, 100, 50, 100, 50],
  
  // Heavy - important action confirmed
  heavy: [50],
  
  // Selection changed
  selection: [10, 30, 10],
  
  // Notification
  notification: [20, 100, 20]
};

/**
 * Trigger haptic feedback
 * @param {'tap'|'light'|'success'|'warning'|'error'|'heavy'|'selection'|'notification'} type - Feedback type
 * @returns {boolean} - Whether feedback was triggered
 */
export function haptic(type = 'tap') {
  if (!supportsVibration) return false;
  
  const pattern = patterns[type];
  if (!pattern) return false;
  
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/**
 * Stop any ongoing vibration
 */
export function stopHaptic() {
  if (supportsVibration) {
    navigator.vibrate(0);
  }
}

/**
 * Check if haptics are supported
 */
export function supportsHaptics() {
  return supportsVibration;
}

/**
 * Custom vibration pattern
 * @param {number[]} pattern - Array of vibration/pause durations in ms
 */
export function customHaptic(pattern) {
  if (!supportsVibration || !Array.isArray(pattern)) return false;
  
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

export default haptic;
