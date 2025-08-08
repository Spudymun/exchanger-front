/**
 * ЦЕНТРАЛЬНЫЙ notification hook - единственная точка входа
 * Объединяет всю notification-логику согласно Rule 20 (запрет избыточности)
 */
import { useNotificationStore } from './state/notification-store';
import type { NotificationStore } from './state/notification-store';

// === HELPER FUNCTIONS (внутренние, из бывших дублированных файлов) ===

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
};

// === API HANDLERS (консолидированы из useNotificationHelpers.ts) ===

const createApiHandlers = (store: NotificationStore) => ({
  apiSuccess: (message: string) => store.success('Success', message),
  apiError: (error: unknown) => {
    const message = extractErrorMessage(error);
    store.error('API Error', message);
  },
  apiLoading: (message: string) => store.info('Loading', message),

  handleApiSuccess: (message: string, description?: string) => store.success(message, description),
  handleApiError: (error: unknown, context?: string) => {
    const errorMessage = extractErrorMessage(error);
    const title = context ? `Error: ${context}` : 'Error';
    return store.error(title, errorMessage);
  },
  handleFormValidation: (errors: Record<string, string[]>) => {
    const errorCount = Object.keys(errors).length;
    if (errorCount === 0) return;
    const title = errorCount === 1 ? 'Validation error' : `Validation errors: ${errorCount}`;
    const description = Object.entries(errors)
      .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
      .join('\n');
    return store.error(title, description, { persistent: true });
  },
});

// === EXCHANGE HANDLERS (консолидированы из useNotificationHelpers.ts) ===

const createExchangeHandlers = (store: NotificationStore) => ({
  orderCreated: (orderId: string) =>
    store.success('Order created', `Order ${orderId} created successfully`),
  orderCompleted: (orderId: string) =>
    store.success('Order completed', `Order ${orderId} processed successfully`),
  exchangeError: (error: string) => store.error('Exchange error', error),

  handleExchangeSuccess: (fromCurrency: string, toCurrency: string, amount: number) =>
    store.success('Exchange created successfully', `${amount} ${fromCurrency} → ${toCurrency}`),
  handleExchangeError: (error: unknown) => {
    const message = extractErrorMessage(error);
    return store.error('Exchange error', message);
  },
});

// === AUTH HANDLERS УДАЛЕНЫ ===
// Теперь используются локализованные переводы в useAuthMutations.ts

// === UTILITY METHODS (консолидированы из useNotificationUtils.ts) ===

const createUtilityMethods = (store: NotificationStore) => ({
  confirmAction: (title: string, description: string, onConfirm: () => void) => {
    return store.warning(title, description, {
      persistent: true,
      action: {
        label: 'Confirm',
        onClick: onConfirm,
        variant: 'destructive' as const,
      },
    });
  },

  askRetry: (title: string, description: string, onRetry: () => void) => {
    return store.error(title, description, {
      persistent: true,
      action: {
        label: 'Retry',
        onClick: onRetry,
        variant: 'default' as const,
      },
    });
  },

  showProgress: (title: string, progress: number) => {
    return store.info(title, `Progress: ${progress}%`, {
      persistent: true,
    });
  },
});

// === ГЛАВНЫЙ HOOK - единственный экспорт ===

export const useNotifications = () => {
  const store = useNotificationStore();

  return {
    // Базовые методы store
    ...store,

    // API handlers
    ...createApiHandlers(store),

    // Exchange handlers
    ...createExchangeHandlers(store),

    // Auth handlers удалены - используйте локализованные переводы

    // Utility methods
    ...createUtilityMethods(store),
  };
};

export type UseNotificationsReturn = ReturnType<typeof useNotifications>;
