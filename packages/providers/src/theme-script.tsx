/**
 * Theme initialization script to prevent flash of incorrect theme (FOIT)
 *
 * This script runs synchronously before React hydration to apply the correct
 * theme class to the document element, preventing the flash of light theme
 * when the user has dark theme selected.
 */
export function ThemeScript() {
  const script = `
    (function() {
      try {
        const THEME_MODES = {
          LIGHT: 'light',
          DARK: 'dark',
          SYSTEM: 'system'
        };
        
        const storedTheme = localStorage.getItem('theme');
        const theme = storedTheme && Object.values(THEME_MODES).includes(storedTheme) 
          ? storedTheme 
          : THEME_MODES.SYSTEM;
        
        if (theme === THEME_MODES.SYSTEM) {
          const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? THEME_MODES.DARK 
            : THEME_MODES.LIGHT;
          document.documentElement.classList.toggle('dark', systemPreference === THEME_MODES.DARK);
        } else {
          document.documentElement.classList.toggle('dark', theme === THEME_MODES.DARK);
        }
      } catch (e) {
        // Fallback to light theme if anything fails
        document.documentElement.classList.remove('dark');
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />;
}
