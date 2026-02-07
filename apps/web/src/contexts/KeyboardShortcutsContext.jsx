import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';

const KeyboardShortcutsContext = createContext(null);

/**
 * Context for managing keyboard shortcuts across the app
 * 
 * Features:
 * - Global shortcuts (navigation, help)
 * - Modal/wizard close handlers registration
 * - Help modal management
 */
export const KeyboardShortcutsProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  
  // Stack of close handlers for modals/wizards (LIFO - last registered closes first)
  const closeHandlersRef = useRef([]);

  // Register a close handler (called when Escape is pressed)
  const registerCloseHandler = useCallback((handler, priority = 0) => {
    const entry = { handler, priority, id: Date.now() + Math.random() };
    closeHandlersRef.current.push(entry);
    // Sort by priority (higher priority closes first)
    closeHandlersRef.current.sort((a, b) => b.priority - a.priority);
    
    // Return unregister function
    return () => {
      closeHandlersRef.current = closeHandlersRef.current.filter(e => e.id !== entry.id);
    };
  }, []);

  // Handle Escape key - close topmost modal/wizard
  const handleEscape = useCallback(() => {
    // First close help if open
    if (showHelp) {
      setShowHelp(false);
      return;
    }
    
    // Then try registered close handlers
    if (closeHandlersRef.current.length > 0) {
      const topHandler = closeHandlersRef.current[0];
      topHandler.handler();
    }
  }, [showHelp]);

  // Handle Ctrl/Cmd+B - Open new booking
  const handleNewBooking = useCallback(() => {
    // Only work on authenticated pages (not on auth page)
    if (location.pathname === '/auth' || location.pathname === '/') {
      return;
    }
    
    // Navigate to dashboard which has the booking wizard
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard', { state: { openBooking: true } });
    } else {
      // If already on dashboard, trigger booking via custom event
      window.dispatchEvent(new CustomEvent('keyboard:openBooking'));
    }
  }, [navigate, location.pathname]);

  // Handle Ctrl/Cmd+T - Go to track page
  const handleGoToTrack = useCallback(() => {
    if (location.pathname !== '/auth' && location.pathname !== '/') {
      navigate('/track');
    }
  }, [navigate, location.pathname]);

  // Handle Ctrl/Cmd+P - Go to profile
  const handleGoToProfile = useCallback(() => {
    if (location.pathname !== '/auth' && location.pathname !== '/') {
      navigate('/profile');
    }
  }, [navigate, location.pathname]);

  // Handle ? - Show shortcuts help
  const handleShowHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

  // Initialize global keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: handleEscape,
    onNewBooking: handleNewBooking,
    onGoToTrack: handleGoToTrack,
    onGoToProfile: handleGoToProfile,
    onShowHelp: handleShowHelp,
    enabled: true
  });

  const value = {
    showHelp,
    setShowHelp,
    registerCloseHandler
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      <KeyboardShortcutsHelp 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
    </KeyboardShortcutsContext.Provider>
  );
};

KeyboardShortcutsProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Hook to access keyboard shortcuts context
 */
export const useKeyboardShortcutsContext = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within a KeyboardShortcutsProvider');
  }
  return context;
};

export default KeyboardShortcutsContext;
