import { THEME_MODES, type ThemeMode } from '@repo/constants';
import { useCallback } from 'react';

import { useNotifications } from './useNotifications';
import { useUIStore } from './useUIStore';

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
  const { theme, setTheme: setStoreTheme } = useUIStore();
  const { success } = useNotifications();

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setStoreTheme(newTheme);

      const themeNames = {
        [THEME_MODES.LIGHT]: 'светлую',
        [THEME_MODES.DARK]: 'темную',
        [THEME_MODES.SYSTEM]: 'системную',
      };

      success('Тема изменена', `Переключено на ${themeNames[newTheme]} тему`);
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
