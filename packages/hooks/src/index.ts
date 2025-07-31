// SSR-safe exports - only types and non-store utilities
export type { UseFormOptions, UseFormReturn, FormField } from './business/useForm';
export { FORM_VALIDATION_SCHEMAS } from './business/useForm';

// Селекторы (pure functions, SSR-safe)
export * from './state/exchange-selectors';

// Types from stores (SSR-safe)
export type {
  NotificationStore,
  Notification,
  NotificationType,
  NotificationAction,
} from './state/notification-store';

export type {
  ExchangeStore,
  ExchangeFormData,
  ExchangeCalculation,
  ExchangeStep,
  ExchangeOrderData,
} from './state/exchange-store';

export type { Trade, Portfolio } from './state/trading-store';

// Client-side hooks (use dynamic imports in components)
// For client components, import from './client-hooks' instead

// UI hooks (SSR-safe)
export * from './ui';
