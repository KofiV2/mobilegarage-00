/**
 * Utilities Index
 * Re-exports all utilities for easier imports
 */

// API helpers
export {
  ErrorType,
  categorizeError,
  getErrorMessage,
  createApiCall,
  createAsyncState,
  ErrorMessages,
} from './api-helpers';

// Accessibility helpers
export {
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
} from './accessibility';
