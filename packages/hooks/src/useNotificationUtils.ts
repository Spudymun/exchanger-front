/**
 * Utility methods для notifications
 * Вспомогательные методы для работы с уведомлениями
 */
import { useNotificationStore } from './state/notification-store.js';

export const useNotificationUtils = () => {
  const store = useNotificationStore();

  return {
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
  };
};
