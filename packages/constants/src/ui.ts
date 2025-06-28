/**
 * UI related constants and configurations
 */

export const ALERT_VARIANTS = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
} as const

export const BUTTON_VARIANTS = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    DESTRUCTIVE: 'destructive',
    OUTLINE: 'outline',
    GHOST: 'ghost',
    LINK: 'link',
} as const

export const BUTTON_SIZES = {
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    ICON: 'icon',
} as const

export const BADGE_VARIANTS = {
    DEFAULT: 'default',
    SECONDARY: 'secondary',
    DESTRUCTIVE: 'destructive',
    OUTLINE: 'outline',
} as const

export const LOADING_VARIANTS = {
    SPINNER: 'spinner',
    SKELETON: 'skeleton',
    DOTS: 'dots',
    PULSE: 'pulse',
} as const

export const MODAL_SIZES = {
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    XL: 'xl',
    FULL: 'full',
} as const

export const THEME_MODES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
} as const

export const BREAKPOINTS = {
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    XL: 'xl',
    '2XL': '2xl',
} as const

export const CHART_INTERVALS = {
    '1M': '1m',
    '5M': '5m',
    '15M': '15m',
    '30M': '30m',
    '1H': '1h',
    '4H': '4h',
    '1D': '1d',
    '1W': '1w',
} as const

export const TABLE_DENSITIES = {
    COMPACT: 'compact',
    NORMAL: 'normal',
    COMFORTABLE: 'comfortable',
} as const

export const ICON_SIZES = {
    XS: 'xs',
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    XL: 'xl',
} as const

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
} as const

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
} as const

// Type exports
export type AlertVariant = typeof ALERT_VARIANTS[keyof typeof ALERT_VARIANTS]
export type ButtonVariant = typeof BUTTON_VARIANTS[keyof typeof BUTTON_VARIANTS]
export type ButtonSize = typeof BUTTON_SIZES[keyof typeof BUTTON_SIZES]
export type BadgeVariant = typeof BADGE_VARIANTS[keyof typeof BADGE_VARIANTS]
export type LoadingVariant = typeof LOADING_VARIANTS[keyof typeof LOADING_VARIANTS]
export type ModalSize = typeof MODAL_SIZES[keyof typeof MODAL_SIZES]
export type ThemeMode = typeof THEME_MODES[keyof typeof THEME_MODES]
export type Breakpoint = typeof BREAKPOINTS[keyof typeof BREAKPOINTS]
export type ChartInterval = typeof CHART_INTERVALS[keyof typeof CHART_INTERVALS]
export type TableDensity = typeof TABLE_DENSITIES[keyof typeof TABLE_DENSITIES]
export type IconSize = typeof ICON_SIZES[keyof typeof ICON_SIZES]
