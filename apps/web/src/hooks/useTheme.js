import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = '3on_theme_preference';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return THEMES.LIGHT;
    return localStorage.getItem(THEME_KEY) || THEMES.SYSTEM;
  });

  const [resolvedTheme, setResolvedTheme] = useState(THEMES.LIGHT);

  // Get system preference
  const getSystemTheme = useCallback(() => {
    if (typeof window === 'undefined') return THEMES.LIGHT;
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? THEMES.DARK 
      : THEMES.LIGHT;
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((effectiveTheme) => {
    const root = document.documentElement;
    
    // Add no-transition class to prevent flash
    document.body.classList.add('no-transition');
    
    if (effectiveTheme === THEMES.DARK) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    
    setResolvedTheme(effectiveTheme);
    
    // Re-enable transitions after a frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.remove('no-transition');
      });
    });
  }, []);

  // Set theme preference
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    
    const effectiveTheme = newTheme === THEMES.SYSTEM 
      ? getSystemTheme() 
      : newTheme;
    applyTheme(effectiveTheme);
  }, [getSystemTheme, applyTheme]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Initialize theme on mount
  useEffect(() => {
    const effectiveTheme = theme === THEMES.SYSTEM 
      ? getSystemTheme() 
      : theme;
    applyTheme(effectiveTheme);
  }, [theme, getSystemTheme, applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== THEMES.SYSTEM) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === THEMES.DARK,
    isLight: resolvedTheme === THEMES.LIGHT,
    isSystem: theme === THEMES.SYSTEM,
    THEMES
  };
}

export default useTheme;
