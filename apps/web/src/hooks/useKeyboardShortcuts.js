import { useEffect, useCallback, useRef } from 'react';

/**
 * Global keyboard shortcuts hook for power users
 * 
 * Shortcuts:
 * - Escape: Close any open modal/wizard
 * - Ctrl/Cmd + B: Open new booking
 * - Ctrl/Cmd + T: Go to track page
 * - Ctrl/Cmd + P: Go to profile
 * - ?: Show keyboard shortcuts help
 * - Arrow keys: Navigate in booking wizard (when wizard is open)
 */

// Check if element is an input field (where shortcuts shouldn't fire)
const isInputElement = (element) => {
  if (!element) return false;
  
  const tagName = element.tagName?.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isEditable = element.isContentEditable;
  
  return isInput || isEditable;
};

// Check if Ctrl (Windows) or Cmd (Mac) is pressed
const isModifierKey = (event) => {
  const isMac = navigator.platform?.toLowerCase().includes('mac') || 
                navigator.userAgent?.toLowerCase().includes('mac');
  return isMac ? event.metaKey : event.ctrlKey;
};

/**
 * Hook for global keyboard shortcuts
 * 
 * @param {Object} options
 * @param {Function} options.onEscape - Handler for Escape key (close modals)
 * @param {Function} options.onNewBooking - Handler for Ctrl/Cmd+B (new booking)
 * @param {Function} options.onGoToTrack - Handler for Ctrl/Cmd+T (go to track)
 * @param {Function} options.onGoToProfile - Handler for Ctrl/Cmd+P (go to profile)
 * @param {Function} options.onShowHelp - Handler for ? key (show shortcuts help)
 * @param {boolean} options.enabled - Whether shortcuts are enabled (default: true)
 */
export const useKeyboardShortcuts = ({
  onEscape,
  onNewBooking,
  onGoToTrack,
  onGoToProfile,
  onShowHelp,
  enabled = true
} = {}) => {
  const handleKeyDown = useCallback((event) => {
    // Skip if disabled
    if (!enabled) return;
    
    // Skip if user is typing in an input field (except for Escape)
    const isTyping = isInputElement(event.target);
    
    // Handle Escape - always works (even in inputs)
    if (event.key === 'Escape') {
      if (onEscape) {
        onEscape(event);
      }
      return;
    }
    
    // Skip other shortcuts if typing in an input
    if (isTyping) return;
    
    const hasModifier = isModifierKey(event);
    
    // Ctrl/Cmd + B: New Booking
    if (hasModifier && (event.key === 'b' || event.key === 'B')) {
      event.preventDefault();
      if (onNewBooking) {
        onNewBooking(event);
      }
      return;
    }
    
    // Ctrl/Cmd + T: Go to Track (prevent browser new tab)
    if (hasModifier && (event.key === 't' || event.key === 'T')) {
      event.preventDefault();
      if (onGoToTrack) {
        onGoToTrack(event);
      }
      return;
    }
    
    // Ctrl/Cmd + P: Go to Profile (prevent browser print)
    if (hasModifier && (event.key === 'p' || event.key === 'P')) {
      event.preventDefault();
      if (onGoToProfile) {
        onGoToProfile(event);
      }
      return;
    }
    
    // ?: Show shortcuts help (Shift + / on most keyboards)
    if (event.key === '?' || (event.shiftKey && event.key === '/')) {
      event.preventDefault();
      if (onShowHelp) {
        onShowHelp(event);
      }
      return;
    }
  }, [enabled, onEscape, onNewBooking, onGoToTrack, onGoToProfile, onShowHelp]);
  
  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

/**
 * Hook for wizard-specific keyboard navigation
 * 
 * @param {Object} options
 * @param {boolean} options.isOpen - Whether the wizard is open
 * @param {number} options.currentStep - Current step number
 * @param {number} options.totalSteps - Total number of steps
 * @param {Function} options.onNext - Handler for going to next step
 * @param {Function} options.onBack - Handler for going to previous step
 * @param {Function} options.canProceed - Function to check if can proceed to next step
 */
export const useWizardKeyboardNav = ({
  isOpen,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  canProceed
} = {}) => {
  const handleKeyDown = useCallback((event) => {
    if (!isOpen) return;
    
    // Skip if user is typing in an input field
    if (isInputElement(event.target)) return;
    
    // Right Arrow or Down Arrow: Next step
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      if (currentStep < totalSteps && canProceed && canProceed()) {
        event.preventDefault();
        if (onNext) onNext();
      }
      return;
    }
    
    // Left Arrow or Up Arrow: Previous step
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      if (currentStep > 1) {
        event.preventDefault();
        if (onBack) onBack();
      }
      return;
    }
  }, [isOpen, currentStep, totalSteps, onNext, onBack, canProceed]);
  
  useEffect(() => {
    if (!isOpen) return;
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isOpen]);
};

// Export shortcut definitions for the help modal
export const KEYBOARD_SHORTCUTS = [
  {
    id: 'escape',
    keys: ['Esc'],
    description: 'Close modal or wizard',
    category: 'general'
  },
  {
    id: 'newBooking',
    keys: ['Ctrl', 'B'],
    keysMac: ['⌘', 'B'],
    description: 'Open new booking',
    category: 'navigation'
  },
  {
    id: 'track',
    keys: ['Ctrl', 'T'],
    keysMac: ['⌘', 'T'],
    description: 'Go to track page',
    category: 'navigation'
  },
  {
    id: 'profile',
    keys: ['Ctrl', 'P'],
    keysMac: ['⌘', 'P'],
    description: 'Go to profile',
    category: 'navigation'
  },
  {
    id: 'help',
    keys: ['?'],
    description: 'Show keyboard shortcuts',
    category: 'general'
  },
  {
    id: 'wizardNav',
    keys: ['←', '→'],
    description: 'Navigate wizard steps',
    category: 'wizard'
  }
];

export default useKeyboardShortcuts;
