import type { NotificationStore } from './state/notification-store.js';
import { useNotificationStore } from './state/notification-store.js';

// Константы
const DEFAULT_ERROR_MESSAGE = 'Произошла ошибка';

// Utility function для обработки ошибок
const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return DEFAULT_ERROR_MESSAGE;
};

// Helper functions для уменьшения размера основной функции
const createApiHandlers = (store: NotificationStore) => ({
  handleApiSuccess: (message: string, description?: string) => {
    return store.success(message, description);
  },

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
  handleExchangeSuccess: (fromCurrency: string, toCurrency: string, amount: number) => {
    return store.success('Обмен создан успешно', `${amount} ${fromCurrency} → ${toCurrency}`);
  },

  handleExchangeError: (error: unknown) => {
    const errorMessage = extractErrorMessage(error);
    return store.error('Ошибка: Обмен валют', errorMessage);
  },

  handleOrderStatusChange: (orderId: string, newStatus: string) => {
    let statusMessage = newStatus;

    switch (newStatus) {
      case 'PENDING':
        statusMessage = 'Ожидание оплаты';
        break;
      case 'PAID':
        statusMessage = 'Оплачено';
        break;
      case 'PROCESSING':
        statusMessage = 'В обработке';
        break;
      case 'COMPLETED':
        statusMessage = 'Завершено';
        break;
      case 'CANCELLED':
        statusMessage = 'Отменено';
        break;
    }

    return store.info(`Заказ ${orderId}`, `Статус изменен: ${statusMessage}`);
  },
});

const createAuthHandlers = (store: NotificationStore) => ({
  handleAuthSuccess: (action: 'login' | 'register' | 'logout') => {
    let message = DEFAULT_ERROR_MESSAGE;

    switch (action) {
      case 'login':
        message = 'Вход выполнен успешно';
        break;
      case 'register':
        message = 'Регистрация завершена';
        break;
      case 'logout':
        message = 'Выход выполнен';
        break;
    }

    return store.success(message);
  },

  handleAuthError: (error: unknown, action: 'login' | 'register' | 'logout') => {
    let context = 'Аутентификация';

    switch (action) {
      case 'login':
        context = 'Вход в систему';
        break;
      case 'register':
        context = 'Регистрация';
        break;
      case 'logout':
        context = 'Выход из системы';
        break;
    }

    const errorMessage = extractErrorMessage(error);
    return store.error(`Ошибка: ${context}`, errorMessage);
  },
});

// Enhanced notification hook с дополнительными методами
export const useNotifications = () => {
  const store = useNotificationStore();

  return {
    // Basic store methods
    ...store,

    // API handlers
    ...createApiHandlers(store),

    // Exchange handlers
    ...createExchangeHandlers(store),

    // Auth handlers
    ...createAuthHandlers(store),

    // Utility methods
    confirmAction: (title: string, description: string, onConfirm: () => void) => {
      return store.warning(title, description, {
        persistent: true,
        action: {
          label: 'Подтвердить',
          onClick: onConfirm,
          variant: 'destructive',
        },
      });
    },

    askRetry: (title: string, description: string, onRetry: () => void) => {
      return store.error(title, description, {
        persistent: true,
        action: {
          label: 'Повторить',
          onClick: onRetry,
          variant: 'outline',
        },
      });
    },

    showProgress: (title: string, description?: string) => {
      return store.info(title, description, {
        persistent: true,
      });
    },

    // Bulk operations
    clearOldNotifications: (olderThanMinutes: number = 5) => {
      const cutoffTime = Date.now() - olderThanMinutes * 60 * 1000;
      const notifications = store.notifications.filter(n => n.createdAt < cutoffTime);

      for (const notification of notifications) {
        store.removeNotification(notification.id);
      }

      return notifications.length;
    },

    hasNotificationsOfType: (type: 'success' | 'error' | 'warning' | 'info') => {
      return store.notifications.some(n => n.type === type);
    },

    getNotificationCount: () => store.notifications.length,

    getUnreadCount: () => {
      // Для будущего функционала "прочитанных" уведомлений
      return store.notifications.length;
    },
  };
};

export type UseNotificationsReturn = ReturnType<typeof useNotifications>;
