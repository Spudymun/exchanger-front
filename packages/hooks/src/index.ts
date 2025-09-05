// SSR-safe exports - only types and non-store utilities
export type { UseFormOptions, UseFormReturn, FormField } from './business/useFormTypes';

// NEW: Next-intl integrated form system
export { useFormWithNextIntl } from './business/useFormWithNextIntl';
export type {
  UseFormWithNextIntlParams,
  UseFormWithNextIntlReturn,
} from './business/useFormWithNextIntl';

// NEW: Order data management hooks
export { useOrderData } from './business/useOrderData';
export type {
  UseOrderDataParams,
  UseOrderDataResult,
  UseOrderStatusHook,
} from './business/useOrderData';

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
