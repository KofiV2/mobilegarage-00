/**
 * Accessibility Helper Utilities
 * Provides consistent accessibility props for React Native components
 */
import { I18nManager } from 'react-native';
import { SIZES } from '../constants/theme';

/**
 * Get accessibility props for a button
 * @param {string} label - The accessible label
 * @param {string} hint - Optional hint for the action
 * @param {boolean} disabled - Whether the button is disabled
 */
export function getButtonAccessibility(label, hint, disabled = false) {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { disabled },
  };
}

/**
 * Get accessibility props for a text input
 * @param {string} label - The accessible label
 * @param {string} hint - Optional hint for the input
 * @param {boolean} required - Whether the field is required
 * @param {string} error - Error message if validation failed
 */
export function getInputAccessibility(label, hint, required = false, error = null) {
  const props = {
    accessible: true,
    accessibilityLabel: required ? `${label}, required` : label,
    accessibilityHint: hint,
  };

  if (error) {
    props.accessibilityLabel = `${label}, error: ${error}`;
  }

  return props;
}

/**
 * Get accessibility props for a header
 * @param {string} label - The header text
 * @param {number} level - Header level (1-6)
 */
export function getHeaderAccessibility(label, level = 1) {
  return {
    accessible: true,
    accessibilityRole: 'header',
    accessibilityLabel: label,
  };
}

/**
 * Get accessibility props for an image
 * @param {string} description - Description of the image
 * @param {boolean} decorative - Whether the image is purely decorative
 */
export function getImageAccessibility(description, decorative = false) {
  if (decorative) {
    return {
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    };
  }
  
  return {
    accessible: true,
    accessibilityRole: 'image',
    accessibilityLabel: description,
  };
}

/**
 * Get accessibility props for a link
 * @param {string} label - The link text
 * @param {string} hint - Where the link goes
 */
export function getLinkAccessibility(label, hint) {
  return {
    accessible: true,
    accessibilityRole: 'link',
    accessibilityLabel: label,
    accessibilityHint: hint || `Opens ${label}`,
  };
}

/**
 * Get accessibility props for a list
 */
export function getListAccessibility() {
  return {
    accessibilityRole: 'list',
  };
}

/**
 * Get accessibility props for a list item
 * @param {number} index - Item index (0-based)
 * @param {number} total - Total number of items
 */
export function getListItemAccessibility(index, total) {
  return {
    accessibilityRole: 'none',
    accessibilityLabel: `Item ${index + 1} of ${total}`,
  };
}

/**
 * Get accessibility props for a tab
 * @param {string} label - Tab label
 * @param {boolean} selected - Whether the tab is selected
 * @param {number} index - Tab index
 * @param {number} total - Total number of tabs
 */
export function getTabAccessibility(label, selected, index, total) {
  return {
    accessible: true,
    accessibilityRole: 'tab',
    accessibilityLabel: `${label}, tab ${index + 1} of ${total}`,
    accessibilityState: { selected },
  };
}

/**
 * Get accessibility props for a checkbox
 * @param {string} label - Checkbox label
 * @param {boolean} checked - Whether the checkbox is checked
 */
export function getCheckboxAccessibility(label, checked) {
  return {
    accessible: true,
    accessibilityRole: 'checkbox',
    accessibilityLabel: label,
    accessibilityState: { checked },
  };
}

/**
 * Get accessibility props for a switch
 * @param {string} label - Switch label
 * @param {boolean} value - Switch value
 */
export function getSwitchAccessibility(label, value) {
  return {
    accessible: true,
    accessibilityRole: 'switch',
    accessibilityLabel: `${label}, ${value ? 'on' : 'off'}`,
    accessibilityState: { checked: value },
  };
}

/**
 * Get live region props for dynamic content
 * @param {string} priority - 'polite' or 'assertive'
 */
export function getLiveRegion(priority = 'polite') {
  return {
    accessibilityLiveRegion: priority,
  };
}

/**
 * Ensure minimum touch target size (48x48)
 * @param {object} style - Original style object
 */
export function ensureMinTouchTarget(style = {}) {
  return {
    ...style,
    minWidth: SIZES.minTouchTarget,
    minHeight: SIZES.minTouchTarget,
    justifyContent: style.justifyContent || 'center',
    alignItems: style.alignItems || 'center',
  };
}

/**
 * Get ARIA-style props for form fields
 * @param {string} fieldName - Field identifier
 * @param {boolean} hasError - Whether field has error
 * @param {string} errorId - ID of error element
 */
export function getFieldAriaProps(fieldName, hasError = false, errorId = null) {
  const props = {
    accessibilityLabel: fieldName,
  };

  if (hasError && errorId) {
    props.accessibilityDescribedBy = errorId;
    props.accessibilityInvalid = true;
  }

  return props;
}

/**
 * Get RTL-aware direction styles
 */
export function getRTLStyles() {
  const isRTL = I18nManager.isRTL;
  
  return {
    isRTL,
    flexRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
    },
    textAlign: isRTL ? 'right' : 'left',
    marginStart: (value) => ({
      [isRTL ? 'marginRight' : 'marginLeft']: value,
    }),
    marginEnd: (value) => ({
      [isRTL ? 'marginLeft' : 'marginRight']: value,
    }),
    paddingStart: (value) => ({
      [isRTL ? 'paddingRight' : 'paddingLeft']: value,
    }),
    paddingEnd: (value) => ({
      [isRTL ? 'paddingLeft' : 'paddingRight']: value,
    }),
  };
}

/**
 * Format a number for accessibility (handles Arabic numerals)
 * @param {number} num - Number to format
 * @param {string} locale - Locale code
 */
export function formatAccessibleNumber(num, locale = 'en-US') {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Announce a message to screen readers
 * Note: Use with AccessibilityInfo.announceForAccessibility
 * @param {string} message - Message to announce
 */
export function getAnnouncementText(message) {
  return message;
}

/**
 * Check if reduced motion is preferred
 * Use with AccessibilityInfo.isReduceMotionEnabled
 */
export async function isReduceMotionEnabled() {
  try {
    const { AccessibilityInfo } = require('react-native');
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}

/**
 * Status badge accessibility helper
 * @param {string} status - Status value
 * @param {string} label - Human-readable status label
 */
export function getStatusBadgeAccessibility(status, label) {
  return {
    accessible: true,
    accessibilityRole: 'text',
    accessibilityLabel: `Status: ${label || status}`,
  };
}

/**
 * Card accessibility helper for grouped content
 * @param {string} title - Card title
 * @param {string} description - Card description
 */
export function getCardAccessibility(title, description = '') {
  return {
    accessible: false, // Let children be focusable
    accessibilityLabel: description ? `${title}. ${description}` : title,
  };
}

/**
 * Navigation header accessibility
 * @param {string} title - Screen title
 * @param {boolean} hasBackButton - Whether back button is visible
 */
export function getScreenHeaderAccessibility(title, hasBackButton = true) {
  return {
    headerTitle: title,
    headerAccessibilityLabel: hasBackButton 
      ? `${title}. Back button available.` 
      : title,
  };
}

export default {
  getButtonAccessibility,
  getInputAccessibility,
  getHeaderAccessibility,
  getImageAccessibility,
  getLinkAccessibility,
  getListAccessibility,
  getListItemAccessibility,
  getTabAccessibility,
  getCheckboxAccessibility,
  getSwitchAccessibility,
  getLiveRegion,
  ensureMinTouchTarget,
  getFieldAriaProps,
  getRTLStyles,
  formatAccessibleNumber,
  getAnnouncementText,
  isReduceMotionEnabled,
  getStatusBadgeAccessibility,
  getCardAccessibility,
  getScreenHeaderAccessibility,
};
