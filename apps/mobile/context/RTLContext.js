/**
 * RTL (Right-to-Left) Context
 * Provides RTL-aware styling and language detection for Arabic support
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RTL_STORAGE_KEY = '@app_rtl_setting';

const RTLContext = createContext({
  isRTL: false,
  locale: 'en',
  toggleRTL: () => {},
  setLocale: () => {},
});

/**
 * RTL languages that should trigger RTL layout
 */
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

/**
 * Check if a locale should use RTL
 */
function shouldUseRTL(locale) {
  const langCode = locale.split('-')[0].toLowerCase();
  return RTL_LANGUAGES.includes(langCode);
}

export function RTLProvider({ children }) {
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);
  const [locale, setLocaleState] = useState('en');

  // Load saved locale preference on mount
  useEffect(() => {
    loadLocalePreference();
  }, []);

  const loadLocalePreference = async () => {
    try {
      const savedLocale = await AsyncStorage.getItem(RTL_STORAGE_KEY);
      if (savedLocale) {
        const { locale: storedLocale, isRTL: storedRTL } = JSON.parse(savedLocale);
        setLocaleState(storedLocale);
        setIsRTL(storedRTL);
        
        // Ensure I18nManager matches saved preference
        if (I18nManager.isRTL !== storedRTL) {
          I18nManager.allowRTL(storedRTL);
          I18nManager.forceRTL(storedRTL);
        }
      }
    } catch (error) {
      console.log('Error loading locale preference:', error);
    }
  };

  const setLocale = async (newLocale) => {
    const newIsRTL = shouldUseRTL(newLocale);
    
    try {
      // Save preference
      await AsyncStorage.setItem(RTL_STORAGE_KEY, JSON.stringify({
        locale: newLocale,
        isRTL: newIsRTL,
      }));

      setLocaleState(newLocale);
      setIsRTL(newIsRTL);

      // Apply RTL change
      if (I18nManager.isRTL !== newIsRTL) {
        I18nManager.allowRTL(newIsRTL);
        I18nManager.forceRTL(newIsRTL);
        
        // On Android, app needs restart for RTL changes
        // You would typically show a message here
        if (Platform.OS === 'android') {
          return { requiresRestart: true };
        }
      }
      
      return { requiresRestart: false };
    } catch (error) {
      console.error('Error setting locale:', error);
      return { error: true };
    }
  };

  const toggleRTL = async () => {
    const newIsRTL = !isRTL;
    const newLocale = newIsRTL ? 'ar' : 'en';
    return setLocale(newLocale);
  };

  return (
    <RTLContext.Provider
      value={{
        isRTL,
        locale,
        setLocale,
        toggleRTL,
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {children}
    </RTLContext.Provider>
  );
}

/**
 * Hook to access RTL context
 */
export function useRTL() {
  const context = useContext(RTLContext);
  
  // Add RTL-aware style helpers
  return {
    ...context,
    styles: getRTLStyles(context.isRTL),
  };
}

/**
 * Get RTL-aware style helpers
 */
function getRTLStyles(isRTL) {
  return {
    // Flex direction
    row: { flexDirection: isRTL ? 'row-reverse' : 'row' },
    rowReverse: { flexDirection: isRTL ? 'row' : 'row-reverse' },
    
    // Text alignment
    textStart: { textAlign: isRTL ? 'right' : 'left' },
    textEnd: { textAlign: isRTL ? 'left' : 'right' },
    
    // Margin helpers
    marginStart: (value) => ({ [isRTL ? 'marginRight' : 'marginLeft']: value }),
    marginEnd: (value) => ({ [isRTL ? 'marginLeft' : 'marginRight']: value }),
    
    // Padding helpers
    paddingStart: (value) => ({ [isRTL ? 'paddingRight' : 'paddingLeft']: value }),
    paddingEnd: (value) => ({ [isRTL ? 'paddingLeft' : 'paddingRight']: value }),
    
    // Border helpers
    borderStartWidth: (value) => ({ [isRTL ? 'borderRightWidth' : 'borderLeftWidth']: value }),
    borderEndWidth: (value) => ({ [isRTL ? 'borderLeftWidth' : 'borderRightWidth']: value }),
    borderStartColor: (color) => ({ [isRTL ? 'borderRightColor' : 'borderLeftColor']: color }),
    borderEndColor: (color) => ({ [isRTL ? 'borderLeftColor' : 'borderRightColor']: color }),
    
    // Position helpers
    start: (value) => ({ [isRTL ? 'right' : 'left']: value }),
    end: (value) => ({ [isRTL ? 'left' : 'right']: value }),
    
    // Icon rotation for directional icons
    iconRotation: isRTL ? '180deg' : '0deg',
    
    // Writing direction
    writingDirection: isRTL ? 'rtl' : 'ltr',
  };
}

/**
 * HOC to inject RTL props
 */
export function withRTL(Component) {
  return function RTLWrappedComponent(props) {
    const rtl = useRTL();
    return <Component {...props} rtl={rtl} />;
  };
}

export default {
  RTLProvider,
  useRTL,
  withRTL,
};
