// Базовые stores (экспортируются под базовыми именами)
export * from './state/index';

// Enhanced hooks с интеграцией stores (экспортируются под обычными именами)
export { useUIStore } from './useUIStore';
export { useNotifications } from './useNotifications';
export { useExchangeStore } from './useExchangeStore';
export { useTheme } from './useTheme';

// Business logic hooks
export { useEnhancedAuth } from './business/useAuth';
export { useExchange } from './business/useExchange';
export { useOrderTracking } from './business/useOrderTracking';
export { useForm, FORM_VALIDATION_SCHEMAS } from './business/useForm';
export type { UseFormOptions, UseFormReturn, FormField } from './business/useForm';

// Re-export trading store as is (no enhancements needed)
export { useTradingStore } from './state/trading-store';

// Селекторы
export * from './state/exchange-selectors';

// Temporarily disable UI exports until they are properly implemented
// export * from './ui'
