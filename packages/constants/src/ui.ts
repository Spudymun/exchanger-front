/**
 * UI related constants and configurations
 */

// Numeric constants for UI components and layout
export const UI_NUMERIC_CONSTANTS = {
  // Grid and layout
  DEFAULT_GRID_COLUMNS: 3,
  GRID_COLUMNS_MEDIUM: 4,
  GRID_COLUMNS_LARGE: 5,

  // Spacing and sizing
  ICON_SIZE_SMALL: 4,

  // Pagination and limits
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE_SMALL: 20,
  MAX_PAGE_SIZE_LARGE: 50,

  // Table rendering
  SKELETON_ROWS_COUNT: 5,
  ROW_ID_TRUNCATE_LENGTH: 50,

  // Tree view constants
  TREE_LEVEL_PADDING: 16,

  // Form validation
  MIN_SUBJECT_LENGTH: 5,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_RECENT_ORDERS: 5,

  // Mock data limits
  MOCK_DATA_ROWS: 3,

  // Time and durations (in ms)
  DEFAULT_PORT: 3000,
  QUERY_STALE_TIME: 5000,
  NOTIFICATION_AUTO_REMOVE_TIMEOUT: 5000,
  ORDER_STATUS_REFRESH_INTERVAL: 30000,

  // Time constants
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,

  // Grid calculations
  GRID_LAYOUT_COLS: 36,
  GRID_LAYOUT_ROWS: 9,

  // ID generation
  ID_GENERATION_BASE: 36,
  ID_GENERATION_LENGTH: 9,

  // Currency and validation
  CURRENCY_CODE_LENGTH: 3,

  // Web page styling
  WEB_PAGE_PADDING: '24px',
  WEB_BUTTON_PADDING: '12px 24px',
  WEB_CARD_BORDER_RADIUS: '8px',
  WEB_GRID_GAP: '20px',
} as const;

export const ALERT_VARIANTS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export const BUTTON_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DESTRUCTIVE: 'destructive',
  OUTLINE: 'outline',
  GHOST: 'ghost',
  LINK: 'link',
} as const;

export const BUTTON_SIZES = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  ICON: 'icon',
} as const;

export const BADGE_VARIANTS = {
  DEFAULT: 'default',
  SECONDARY: 'secondary',
  DESTRUCTIVE: 'destructive',
  OUTLINE: 'outline',
} as const;

export const LOADING_VARIANTS = {
  SPINNER: 'spinner',
  SKELETON: 'skeleton',
  DOTS: 'dots',
  PULSE: 'pulse',
} as const;

export const MODAL_SIZES = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  FULL: 'full',
} as const;

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export const BREAKPOINTS = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  '2XL': '2xl',
} as const;

export const CHART_INTERVALS = {
  '1M': '1m',
  '5M': '5m',
  '15M': '15m',
  '30M': '30m',
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
  '1W': '1w',
} as const;

export const TABLE_DENSITIES = {
  COMPACT: 'compact',
  NORMAL: 'normal',
  COMFORTABLE: 'comfortable',
} as const;

export const ICON_SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const;

// CSS class constants for components
export const CSS_CLASSES = {
  // Icon sizes (Tailwind classes)
  ICON_SIZE_SMALL: 'h-3 w-3',
  ICON_SIZE_MEDIUM: 'h-4 w-4',
} as const;

// UI Status configurations with colors and icons
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Ожидает',
    color: 'yellow',
    icon: 'clock',
    canCancel: true,
    canEdit: true,
  },
  open: {
    label: 'Открыт',
    color: 'blue',
    icon: 'play',
    canCancel: true,
    canEdit: false,
  },
  partially_filled: {
    label: 'Частично исполнен',
    color: 'orange',
    icon: 'progress',
    canCancel: true,
    canEdit: false,
  },
  filled: {
    label: 'Исполнен',
    color: 'green',
    icon: 'check-circle',
    canCancel: false,
    canEdit: false,
  },
  cancelled: {
    label: 'Отменен',
    color: 'gray',
    icon: 'x-circle',
    canCancel: false,
    canEdit: false,
  },
  rejected: {
    label: 'Отклонен',
    color: 'red',
    icon: 'x-circle',
    canCancel: false,
    canEdit: false,
  },
} as const;

export const TRANSACTION_STATUS_CONFIG = {
  pending: {
    label: 'Ожидает',
    color: 'yellow',
    icon: 'clock',
  },
  processing: {
    label: 'Обрабатывается',
    color: 'blue',
    icon: 'loader',
  },
  completed: {
    label: 'Завершена',
    color: 'green',
    icon: 'check',
  },
  failed: {
    label: 'Ошибка',
    color: 'red',
    icon: 'x',
  },
  cancelled: {
    label: 'Отменена',
    color: 'gray',
    icon: 'x-circle',
  },
} as const;

// Design token constants for color scales
export const COLOR_SCALE_KEYS = {
  LIGHTEST: 50,
  LIGHTER: 100,
  LIGHT: 200,
  LIGHT_MEDIUM: 300,
  MEDIUM: 400,
  MEDIUM_DARK: 500,
  DARK: 600,
  DARKER: 700,
  DARKEST: 800,
  EXTRA_DARK: 900,
  DEEPEST: 950,
} as const;

// Type exports
export type AlertVariant = (typeof ALERT_VARIANTS)[keyof typeof ALERT_VARIANTS];
export type ButtonVariant = (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];
export type ButtonSize = (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES];
export type BadgeVariant = (typeof BADGE_VARIANTS)[keyof typeof BADGE_VARIANTS];
export type LoadingVariant = (typeof LOADING_VARIANTS)[keyof typeof LOADING_VARIANTS];
export type ModalSize = (typeof MODAL_SIZES)[keyof typeof MODAL_SIZES];
export type ThemeMode = (typeof THEME_MODES)[keyof typeof THEME_MODES];
export type Breakpoint = (typeof BREAKPOINTS)[keyof typeof BREAKPOINTS];
export type ChartInterval = (typeof CHART_INTERVALS)[keyof typeof CHART_INTERVALS];
export type TableDensity = (typeof TABLE_DENSITIES)[keyof typeof TABLE_DENSITIES];
export type IconSize = (typeof ICON_SIZES)[keyof typeof ICON_SIZES];
export type ColorScaleKey = (typeof COLOR_SCALE_KEYS)[keyof typeof COLOR_SCALE_KEYS];
