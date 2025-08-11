/**
 * Shared technical SEO and layout constants for all ExchangeGO applications
 * Contains ONLY technical settings that should be consistent across apps
 * Content-specific data (titles, descriptions) should be defined per-app
 */

/**
 * Technical viewport and theme settings shared across all applications
 */
export const LAYOUT_SHARED_CONFIG = {
  // Viewport configuration - consistent across all apps
  VIEWPORT: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',

  // Theme colors using standard values (same as design-tokens: #ffffff, #000000)
  THEME_COLORS: {
    LIGHT: '#ffffff',
    DARK: '#000000',
  },

  // Color scheme meta tag
  COLOR_SCHEME: 'light dark',
} as const;

/**
 * Default Open Graph and Twitter Card settings
 * Apps can override these with their specific content
 */
export const META_DEFAULTS = {
  // Open Graph defaults
  OPEN_GRAPH: {
    TYPE: 'website',
    LOCALE: 'en_US',
  },

  // Twitter Card defaults
  TWITTER: {
    CARD: 'summary_large_image',
  },

  // Robots configuration
  ROBOTS: {
    INDEX: true,
    FOLLOW: true,
  },
} as const;

/**
 * Global CSS classes for layout elements
 */
export const GLOBAL_CSS_CLASSES = {
  BODY_BASE: 'antialiased',
  HTML_SUPPRESS_HYDRATION: true,
} as const;
