import { THEME_MODES, type ThemeMode } from '@repo/constants';
import { useCallback } from 'react';

import { useNotifications } from './useNotifications';
import { useUIStoreEnhanced } from './useUIStore';

/**
 * Enhanced theme hook with notifications and centralized state
 *
 * Provides unified API for theme management with:
 * - Centralized state through ui-store
 * - User notifications on theme changes
 * - Type-safe theme constants
 * - Convenience boolean flags
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, setTheme, isDark } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(THEME_MODES.DARK)}>
 *       Current: {theme} (Dark: {isDark})
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme() {
  const { theme, setTheme: setStoreTheme } = useUIStoreEnhanced();
  const { success } = useNotifications();

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setStoreTheme(newTheme);

      const themeNames = {
        [THEME_MODES.LIGHT]: 'light',
        [THEME_MODES.DARK]: 'dark',
        [THEME_MODES.SYSTEM]: 'system',
      };

      success('Theme changed', `Switched to ${themeNames[newTheme]} theme`);
    },
    [setStoreTheme, success]
  );

  return {
    theme,
    setTheme,
    isLight: theme === THEME_MODES.LIGHT,
    isDark: theme === THEME_MODES.DARK,
    isSystem: theme === THEME_MODES.SYSTEM,
  };
}
