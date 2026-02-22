import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { webLightTheme, webDarkTheme, Theme } from '@fluentui/react-components';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  currentTheme: 'light' | 'dark';
  changeTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Load saved preference from localStorage or default to 'system'
    const savedMode = localStorage.getItem('ppsb-theme-mode') as ThemeMode;
    return savedMode && ['light', 'dark', 'system'].includes(savedMode) ? savedMode : 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<Theme>(() => {
    // Initialize based on saved preference to prevent theme flash
    const savedMode = localStorage.getItem('ppsb-theme-mode') as ThemeMode;
    const initialMode = savedMode && ['light', 'dark', 'system'].includes(savedMode) ? savedMode : 'system';

    if (initialMode === 'system') {
      const systemTheme = getSystemTheme();
      return systemTheme === 'dark' ? webDarkTheme : webLightTheme;
    }
    return initialMode === 'dark' ? webDarkTheme : webLightTheme;
  });

  useEffect(() => {
    // Update effective theme based on mode
    if (themeMode === 'system') {
      const systemTheme = getSystemTheme();
      setEffectiveTheme(systemTheme === 'dark' ? webDarkTheme : webLightTheme);
    } else {
      setEffectiveTheme(themeMode === 'dark' ? webDarkTheme : webLightTheme);
    }
  }, [themeMode]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        setEffectiveTheme(e.matches ? webDarkTheme : webLightTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const changeTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('ppsb-theme-mode', mode);
  };

  const getCurrentThemeName = (): 'light' | 'dark' => {
    return effectiveTheme === webDarkTheme ? 'dark' : 'light';
  };

  const value: ThemeContextValue = {
    theme: effectiveTheme,
    themeMode,
    currentTheme: getCurrentThemeName(),
    changeTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
