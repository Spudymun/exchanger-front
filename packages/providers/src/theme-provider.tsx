'use client';

import { THEME_MODES, type ThemeMode } from '@repo/constants';
import { useUIStore } from '@repo/hooks/src/state/ui-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DARK_THEME = 'dark' as const;
const LIGHT_THEME = 'light' as const;

// Helper functions
const getSystemPreference = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
};

const resolveTheme = (theme: ThemeMode): 'light' | 'dark' => {
  if (theme === THEME_MODES.SYSTEM) {
    return getSystemPreference();
  }
  return theme === THEME_MODES.DARK ? DARK_THEME : LIGHT_THEME;
};

const applyThemeToDOM = (theme: ThemeMode) => {
  const root = window.document.documentElement;
  const resolved = resolveTheme(theme);
  root.classList.toggle(DARK_THEME, resolved === DARK_THEME);
};

export function ThemeProvider({
  children,
  defaultTheme: _defaultTheme = THEME_MODES.SYSTEM,
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}) {
  const { theme, setTheme } = useUIStore();

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return resolveTheme(theme);
    }
    return LIGHT_THEME;
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      setResolvedTheme(resolveTheme(theme));
      return;
    }

    setResolvedTheme(resolveTheme(theme));
    applyThemeToDOM(theme);
  }, [theme, isInitialized]);

  useEffect(() => {
    if (theme === THEME_MODES.SYSTEM) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const systemPreference = getSystemPreference();
        setResolvedTheme(systemPreference);
        document.documentElement.classList.toggle(DARK_THEME, systemPreference === DARK_THEME);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      <div suppressHydrationWarning>{children}</div>
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
