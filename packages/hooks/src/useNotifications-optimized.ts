/**
 * Оптимизированный notification hook
 * Разделен на более мелкие композируемые части
 */
import { useNotificationStore } from './state/notification-store.js';
import type { NotificationStore } from './state/notification-store.js';
import { useNotificationUtils } from './useNotificationUtils.js';

// Сохраняем helper функции в том же файле для совместимости

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Произошла неизвестная ошибка';
};

const createApiHandlers = (store: NotificationStore) => ({
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

const createExchangeHandlers = (store: NotificationStore) => ({
  handleExchangeSuccess: (fromCurrency: string, toCurrency: string, amount: number) => 
    store.success('Обмен создан успешно', `${amount} ${fromCurrency} → ${toCurrency}`),
  handleExchangeError: (error: unknown) => {
    const message = extractErrorMessage(error);
    return store.error('Ошибка обмена', message);
  },
});

const createAuthHandlers = (store: NotificationStore) => ({
  handleLoginSuccess: (username?: string) => 
    store.success('Вход выполнен', username ? `Добро пожаловать, ${username}!` : 'Добро пожаловать!'),
  handleLoginError: (error?: unknown) => {
    const message = error ? extractErrorMessage(error) : 'Неверные учетные данные';
    return store.error('Ошибка входа', message);
  },
  handleLogoutSuccess: () => store.info('Выход выполнен', 'До свидания!'),
});

// Основной hook - теперь компактный
export const useNotifications = () => {
  const store = useNotificationStore();
  const utils = useNotificationUtils();

  return {
    ...store,
    ...createApiHandlers(store),
    ...createExchangeHandlers(store),
    ...createAuthHandlers(store),
    ...utils,
  };
};

export type UseNotificationsReturn = ReturnType<typeof useNotifications>;
