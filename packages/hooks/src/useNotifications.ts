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
  return 'Произошла неизвестная ошибка';
};

// === API HANDLERS (консолидированы из useNotificationHelpers.ts) ===

const createApiHandlers = (store: NotificationStore) => ({
  apiSuccess: (message: string) => store.success('Успешно', message),
  apiError: (error: unknown) => {
    const message = extractErrorMessage(error);
    store.error('Ошибка API', message);
  },
  apiLoading: (message: string) => store.info('Загрузка', message),

  handleApiSuccess: (message: string, description?: string) => store.success(message, description),
  handleApiError: (error: unknown, context?: string) => {
    const errorMessage = extractErrorMessage(error);
    const title = context ? `Ошибка: ${context}` : 'Ошибка';
    return store.error(title, errorMessage);
  },
  handleFormValidation: (errors: Record<string, string[]>) => {
    const errorCount = Object.keys(errors).length;
    if (errorCount === 0) return;
    const title = errorCount === 1 ? 'Ошибка валидации' : `Ошибок валидации: ${errorCount}`;
    const description = Object.entries(errors)
      .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
      .join('\n');
    return store.error(title, description, { persistent: true });
  },
});

// === EXCHANGE HANDLERS (консолидированы из useNotificationHelpers.ts) ===

const createExchangeHandlers = (store: NotificationStore) => ({
  orderCreated: (orderId: string) =>
    store.success('Заявка создана', `Заявка ${orderId} успешно создана`),
  orderCompleted: (orderId: string) =>
    store.success('Заявка завершена', `Заявка ${orderId} успешно обработана`),
  exchangeError: (error: string) => store.error('Ошибка обмена', error),

  handleExchangeSuccess: (fromCurrency: string, toCurrency: string, amount: number) =>
    store.success('Обмен создан успешно', `${amount} ${fromCurrency} → ${toCurrency}`),
  handleExchangeError: (error: unknown) => {
    const message = extractErrorMessage(error);
    return store.error('Ошибка обмена', message);
  },
});

// === AUTH HANDLERS (консолидированы из useNotificationHelpers.ts) ===

const createAuthHandlers = (store: NotificationStore) => ({
  loginSuccess: () => store.success('Вход выполнен', 'Добро пожаловать!'),
  loginError: () => store.error('Ошибка входа', 'Неверные учетные данные'),
  logoutSuccess: () => store.info('Выход выполнен', 'До свидания!'),

  handleLoginSuccess: (username?: string) =>
    store.success(
      'Вход выполнен',
      username ? `Добро пожаловать, ${username}!` : 'Добро пожаловать!'
    ),
  handleLoginError: (error?: unknown) => {
    const message = error ? extractErrorMessage(error) : 'Неверные учетные данные';
    return store.error('Ошибка входа', message);
  },
  handleLogoutSuccess: () => store.info('Выход выполнен', 'До свидания!'),
});

// === UTILITY METHODS (консолидированы из useNotificationUtils.ts) ===

const createUtilityMethods = (store: NotificationStore) => ({
  confirmAction: (title: string, description: string, onConfirm: () => void) => {
    return store.warning(title, description, {
      persistent: true,
      action: {
        label: 'Подтвердить',
        onClick: onConfirm,
        variant: 'destructive' as const,
      },
    });
  },

  askRetry: (title: string, description: string, onRetry: () => void) => {
    return store.error(title, description, {
      persistent: true,
      action: {
        label: 'Повторить',
        onClick: onRetry,
        variant: 'default' as const,
      },
    });
  },

  showProgress: (title: string, progress: number) => {
    return store.info(title, `Прогресс: ${progress}%`, {
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

    // Auth handlers
    ...createAuthHandlers(store),

    // Utility methods
    ...createUtilityMethods(store),
  };
};

export type UseNotificationsReturn = ReturnType<typeof useNotifications>;
