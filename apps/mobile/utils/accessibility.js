/**
 * Accessibility Utilities for Mobile App
 * Provides helper functions and constants for WCAG 2.1 AA compliance
 */

// Minimum touch target size (WCAG 2.5.5 - Level AAA: 44x44, Level AA: 24x24, Best Practice: 48x48)
export const MIN_TOUCH_TARGET = 48;

// Minimum font sizes for accessibility
export const MIN_FONT_SIZES = {
  body: 16,
  caption: 14,
  minimum: 12, // Use sparingly
};

// Accessible color contrasts (WCAG AA requires 4.5:1 for normal text, 3:1 for large text)
export const ACCESSIBLE_COLORS = {
  placeholder: '#666666', // 4.59:1 contrast on white
  secondaryText: '#4B5563', // 8.59:1 contrast on white
  tertiaryText: '#6B7280', // 5.74:1 contrast on white
};

/**
 * Creates accessibility props for a button
 * @param {string} label - The button label for screen readers
 * @param {string} hint - What happens when the button is pressed
 * @param {boolean} disabled - Whether the button is disabled
 * @returns {object} Accessibility props
 */
export const getButtonAccessibility = (label, hint = null, disabled = false) => ({
  accessibilityRole: 'button',
  accessibilityLabel: label,
  ...(hint && { accessibilityHint: hint }),
  accessibilityState: { disabled },
  accessible: true,
});

/**
 * Creates accessibility props for a text input
 * @param {string} label - The input field label
 * @param {string} hint - What the user should enter
 * @param {boolean} required - Whether the field is required
 * @returns {object} Accessibility props
 */
export const getInputAccessibility = (label, hint = null, required = false) => ({
  accessibilityLabel: label + (required ? ' (required)' : ''),
  ...(hint && { accessibilityHint: hint }),
  accessible: true,
});

/**
 * Creates accessibility props for a header/title
 * @param {string} label - The header text
 * @param {number} level - The heading level (1-6)
 * @returns {object} Accessibility props
 */
export const getHeaderAccessibility = (label, level = 1) => ({
  accessibilityRole: 'header',
  accessibilityLabel: label,
  accessible: true,
  ...(level && { 'aria-level': level }),
});

/**
 * Creates accessibility props for an image
 * @param {string} label - Description of the image
 * @param {boolean} decorative - Whether the image is purely decorative
 * @returns {object} Accessibility props
 */
export const getImageAccessibility = (label, decorative = false) => {
  if (decorative) {
    return {
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    };
  }
  return {
    accessibilityRole: 'image',
    accessibilityLabel: label,
    accessible: true,
  };
};

/**
 * Creates accessibility props for a link
 * @param {string} label - The link text/description
 * @param {string} hint - Where the link leads
 * @returns {object} Accessibility props
 */
export const getLinkAccessibility = (label, hint = null) => ({
  accessibilityRole: 'link',
  accessibilityLabel: label,
  ...(hint && { accessibilityHint: hint }),
  accessible: true,
});

/**
 * Creates accessibility props for a status message
 * @param {string} type - Type of announcement ('polite' or 'assertive')
 * @returns {object} Accessibility props
 */
export const getStatusAccessibility = (type = 'polite') => ({
  accessibilityLiveRegion: type,
  accessible: true,
});

/**
 * Creates accessibility props for a list
 * @returns {object} Accessibility props
 */
export const getListAccessibility = () => ({
  accessibilityRole: 'list',
  accessible: false, // Let children be focusable
});

/**
 * Creates accessibility props for a list item
 * @param {number} index - Item index
 * @param {number} total - Total number of items
 * @returns {object} Accessibility props
 */
export const getListItemAccessibility = (index, total) => ({
  accessibilityLabel: `Item ${index + 1} of ${total}`,
  accessible: true,
});

/**
 * Ensures minimum touch target size
 * @param {object} style - Current style object
 * @returns {object} Style with minimum touch target
 */
export const ensureMinTouchTarget = (style = {}) => ({
  ...style,
  minWidth: MIN_TOUCH_TARGET,
  minHeight: MIN_TOUCH_TARGET,
});

/**
 * Gets accessible font size based on text importance
 * @param {string} type - Text type ('body', 'caption', etc.)
 * @returns {number} Font size
 */
export const getAccessibleFontSize = (type = 'body') => {
  return MIN_FONT_SIZES[type] || MIN_FONT_SIZES.body;
};

/**
 * Announces text to screen reader (for dynamic content updates)
 * @param {string} message - Message to announce
 * @param {object} AccessibilityInfo - React Native AccessibilityInfo
 */
export const announceForAccessibility = (message, AccessibilityInfo) => {
  if (AccessibilityInfo && AccessibilityInfo.announceForAccessibility) {
    AccessibilityInfo.announceForAccessibility(message);
  }
};

export default {
  MIN_TOUCH_TARGET,
  MIN_FONT_SIZES,
  ACCESSIBLE_COLORS,
  getButtonAccessibility,
  getInputAccessibility,
  getHeaderAccessibility,
  getImageAccessibility,
  getLinkAccessibility,
  getStatusAccessibility,
  getListAccessibility,
  getListItemAccessibility,
  ensureMinTouchTarget,
  getAccessibleFontSize,
  announceForAccessibility,
};
