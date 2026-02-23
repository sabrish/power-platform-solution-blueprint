import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { webLightTheme, webDarkTheme, Theme } from '@fluentui/react-components';

interface ThemeContextValue {
  theme: Theme;
  currentTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(webLightTheme);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const applyTheme = (mode: 'light' | 'dark') => {
      setCurrentTheme(mode);
      setTheme(mode === 'dark' ? webDarkTheme : webLightTheme);
    };

    const fallbackToSystem = () => {
      const isDark =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(isDark ? 'dark' : 'light');
    };

    const pptbAPI = (window as any).toolboxAPI;

    // Read initial theme
    if (pptbAPI?.utils?.getCurrentTheme) {
      pptbAPI.utils
        .getCurrentTheme()
        .then((mode: 'light' | 'dark') => applyTheme(mode))
        .catch(fallbackToSystem);
    } else {
      fallbackToSystem();
    }

    // Re-read theme whenever settings are saved
    const handleEvent = (_event: any, payload: any) => {
      if (payload?.event === 'settings:updated' && payload?.data?.theme) {
        applyTheme(payload.data.theme as 'light' | 'dark');
      }
    };
    pptbAPI?.events?.on(handleEvent);
    return () => {
      pptbAPI?.events?.off(handleEvent);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
