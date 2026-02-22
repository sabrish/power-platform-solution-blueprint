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

  // Safely read from localStorage (SSR/test-safe)
  const getSavedThemeMode = (): ThemeMode => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return 'system';
    }
    try {
      const savedMode = localStorage.getItem('ppsb-theme-mode') as ThemeMode;
      return savedMode && ['light', 'dark', 'system'].includes(savedMode) ? savedMode : 'system';
    } catch {
      return 'system';
    }
  };

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Load saved preference from localStorage or default to 'system'
    return getSavedThemeMode();
  });

  const [effectiveTheme, setEffectiveTheme] = useState<Theme>(() => {
    // Initialize based on saved preference to prevent theme flash
    const initialMode = getSavedThemeMode();

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
    // Listen for system theme changes (browser-only)
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (themeMode === 'system') {
        setEffectiveTheme(e.matches ? webDarkTheme : webLightTheme);
      }
    };

    // Modern browsers use addEventListener, older browsers use addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers (Safari < 14, etc.)
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener?.(handleChange);
    }

    // If neither method is available, return undefined
    return undefined;
  }, [themeMode]);

  const changeTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    // Safely write to localStorage (SSR/test-safe)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('ppsb-theme-mode', mode);
      } catch {
        // Ignore localStorage errors (e.g., quota exceeded, privacy mode)
      }
    }
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
