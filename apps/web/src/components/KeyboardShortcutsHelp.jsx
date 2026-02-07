import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import './KeyboardShortcutsHelp.css';

// Detect if user is on Mac
const isMac = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform?.toLowerCase().includes('mac') || 
         navigator.userAgent?.toLowerCase().includes('mac');
};

const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const mac = isMac();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap and focus modal when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const categories = {
    navigation: {
      label: t('shortcuts.navigation', 'Navigation'),
      shortcuts: KEYBOARD_SHORTCUTS.filter(s => s.category === 'navigation')
    },
    wizard: {
      label: t('shortcuts.wizard', 'Booking Wizard'),
      shortcuts: KEYBOARD_SHORTCUTS.filter(s => s.category === 'wizard')
    },
    general: {
      label: t('shortcuts.general', 'General'),
      shortcuts: KEYBOARD_SHORTCUTS.filter(s => s.category === 'general')
    }
  };

  const renderKeys = (shortcut) => {
    const keys = mac && shortcut.keysMac ? shortcut.keysMac : shortcut.keys;
    return keys.map((key, index) => (
      <React.Fragment key={key}>
        <kbd className="shortcut-key">{key}</kbd>
        {index < keys.length - 1 && <span className="key-separator">+</span>}
      </React.Fragment>
    ));
  };

  return (
    <div className="shortcuts-overlay" onClick={onClose} role="presentation">
      <div 
        ref={modalRef}
        className="shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        tabIndex={-1}
      >
        <div className="shortcuts-header">
          <h2 id="shortcuts-title" className="shortcuts-title">
            ⌨️ {t('shortcuts.title', 'Keyboard Shortcuts')}
          </h2>
          <button 
            className="shortcuts-close" 
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
          >
            ×
          </button>
        </div>

        <div className="shortcuts-content">
          {Object.entries(categories).map(([categoryKey, category]) => (
            category.shortcuts.length > 0 && (
              <div key={categoryKey} className="shortcuts-category">
                <h3 className="category-label">{category.label}</h3>
                <div className="shortcuts-list">
                  {category.shortcuts.map((shortcut) => (
                    <div key={shortcut.id} className="shortcut-item">
                      <div className="shortcut-keys">
                        {renderKeys(shortcut)}
                      </div>
                      <div className="shortcut-description">
                        {t(`shortcuts.${shortcut.id}`, shortcut.description)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        <div className="shortcuts-footer">
          <p className="shortcuts-tip">
            💡 {t('shortcuts.tip', 'Press ? anytime to show this help')}
          </p>
        </div>
      </div>
    </div>
  );
};

KeyboardShortcutsHelp.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default KeyboardShortcutsHelp;
