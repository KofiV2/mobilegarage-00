import { useEffect, useRef, useCallback } from 'react';

/**
 * useFocusTrap Hook
 * 
 * Traps focus within a container element for accessibility compliance.
 * Essential for modals, dialogs, and other overlay components.
 * 
 * Features:
 * - Traps focus within container
 * - Handles Tab and Shift+Tab navigation
 * - Restores focus to previously focused element on unmount
 * - Auto-focuses first focusable element (optional)
 * - Supports custom initial focus element
 * 
 * Usage:
 * const MyModal = ({ isOpen, onClose }) => {
 *   const modalRef = useFocusTrap(isOpen);
 *   
 *   return isOpen ? (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       <button>First focusable</button>
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   ) : null;
 * };
 * 
 * @param {boolean} isActive - Whether focus trap is active
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFocus - Auto-focus first element (default: true)
 * @param {boolean} options.restoreFocus - Restore focus on deactivation (default: true)
 * @param {string} options.initialFocusSelector - CSS selector for initial focus element
 * @returns {React.RefObject} Ref to attach to the container element
 */
export function useFocusTrap(isActive, options = {}) {
  const {
    autoFocus = true,
    restoreFocus = true,
    initialFocusSelector = null
  } = options;

  const containerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Get all focusable elements within container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled]):not([tabindex="-1"])',
      'a[href]:not([tabindex="-1"])',
      'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = containerRef.current.querySelectorAll(focusableSelectors);
    return Array.from(elements).filter(el => {
      // Filter out elements that are not visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             el.offsetParent !== null;
    });
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift + Tab (backwards)
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab (forwards)
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [getFocusableElements]);

  // Setup and cleanup
  useEffect(() => {
    if (!isActive) return;

    // Store currently focused element for restoration
    if (restoreFocus) {
      previouslyFocusedRef.current = document.activeElement;
    }

    // Auto-focus first element or specified element
    if (autoFocus) {
      // Use setTimeout to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (!containerRef.current) return;

        let elementToFocus = null;

        // Try to find initial focus element by selector
        if (initialFocusSelector) {
          elementToFocus = containerRef.current.querySelector(initialFocusSelector);
        }

        // Fall back to first focusable element
        if (!elementToFocus) {
          const focusableElements = getFocusableElements();
          elementToFocus = focusableElements[0];
        }

        if (elementToFocus) {
          elementToFocus.focus();
        }
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [isActive, autoFocus, initialFocusSelector, restoreFocus, getFocusableElements]);

  // Add/remove keyboard event listener
  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }

      // Restore focus when deactivated
      if (restoreFocus && previouslyFocusedRef.current) {
        // Use setTimeout to ensure proper restoration
        setTimeout(() => {
          if (previouslyFocusedRef.current && 
              typeof previouslyFocusedRef.current.focus === 'function') {
            previouslyFocusedRef.current.focus();
          }
        }, 10);
      }
    };
  }, [isActive, handleKeyDown, restoreFocus]);

  return containerRef;
}

/**
 * useFocusReturn Hook
 * 
 * Simpler hook that just handles returning focus when a component unmounts.
 * Useful for components that don't need full focus trapping.
 * 
 * @param {boolean} isActive - Whether to track and restore focus
 * @returns {void}
 */
export function useFocusReturn(isActive) {
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      previouslyFocusedRef.current = document.activeElement;
    }

    return () => {
      if (isActive && previouslyFocusedRef.current) {
        setTimeout(() => {
          if (previouslyFocusedRef.current && 
              typeof previouslyFocusedRef.current.focus === 'function') {
            previouslyFocusedRef.current.focus();
          }
        }, 10);
      }
    };
  }, [isActive]);
}

export default useFocusTrap;
