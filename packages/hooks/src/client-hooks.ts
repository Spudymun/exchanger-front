'use client';

// Client-side only hooks to avoid SSR issues
export * from './useTheme';
export * from './useNotifications';
export * from './useExchangeStore';
export * from './business/useForm';
export * from './business/useAuth';

export * from './business/useExchange';
export * from './business/useOrderTracking';
export { useMathCaptcha, CAPTCHA_CONFIGS } from './business/useMathCaptcha';
export type { AuthMessages } from './business/authMessages';

// Enhanced UI Store (client-side only) - with notifications integration
export { useUIStore } from './useUIStore';

// Re-export base stores directly (client-side only) - базовые stores без дублирования
export { useTradingStore } from './state/trading-store';
export { useNotificationStore } from './state/notification-store';
export { useExchangeStore as useExchangeStoreBase } from './state/exchange-store';
