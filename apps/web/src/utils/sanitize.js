/**
 * Sanitization Utilities
 *
 * Provides HTML escaping and input sanitization to prevent XSS attacks.
 */

/**
 * Escapes HTML special characters to prevent XSS in HTML contexts
 * @param {any} str - The string to escape
 * @returns {string} - HTML-escaped string
 */
export const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates phone number format
 * Supports UAE format and general international numbers
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\D/g, '');
  // UAE mobile: 05XXXXXXXX or +9715XXXXXXXX or 9715XXXXXXXX
  // Also allow general 9-15 digit numbers
  return /^(\+?971|0)?5[0-9]{8}$/.test(cleaned) || /^[0-9]{9,15}$/.test(cleaned);
};

/**
 * Sanitizes phone number for use in tel: URI
 * Returns null if phone is invalid (prevents javascript: injection)
 * @param {string} phone - Phone number to sanitize
 * @returns {string|null} - Sanitized phone number or null if invalid
 */
export const sanitizePhoneUri = (phone) => {
  if (!phone) return null;
  // Only allow digits and + symbol
  const sanitized = String(phone).replace(/[^0-9+]/g, '');
  // Must be a valid phone format
  if (!isValidPhone(sanitized)) return null;
  return sanitized;
};

/**
 * Strips HTML tags from a string (for display purposes)
 * @param {string} str - String that may contain HTML
 * @returns {string} - String with HTML tags removed
 */
export const stripHtml = (str) => {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '');
};

/**
 * Sanitizes a URL to prevent javascript: and data: URI attacks
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Sanitized URL or null if dangerous
 */
export const sanitizeUrl = (url) => {
  if (!url) return null;
  const trimmed = String(url).trim().toLowerCase();
  // Block dangerous protocols
  if (trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('vbscript:')) {
    return null;
  }
  return url;
};

export default {
  escapeHtml,
  isValidPhone,
  sanitizePhoneUri,
  stripHtml,
  sanitizeUrl
};
