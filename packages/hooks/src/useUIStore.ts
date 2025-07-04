import { useNotificationStore } from './state/notification-store.js';
import { useUIStore as useUIStoreBase } from './state/ui-store.js';

// Enhanced UI Store wrapper с интеграцией уведомлений
export const useUIStore = () => {
  const uiStore = useUIStoreBase();
  const notificationStore = useNotificationStore();

  return {
    // UI Store state
    ...uiStore,

    // Enhanced methods с интеграцией уведомлений
    setTheme: (theme: 'light' | 'dark' | 'system') => {
      uiStore.setTheme(theme);
      notificationStore.success(
        'Тема изменена',
        `Переключено на ${theme === 'light' ? 'светлую' : theme === 'dark' ? 'темную' : 'системную'} тему`
      );
    },

    openModal: (modalId: string) => {
      uiStore.openModal(modalId);
    },

    closeModal: () => {
      uiStore.closeModal();
    },

    closeAllModals: () => {
      uiStore.closeModal();
      for (const modal of Object.keys(uiStore.modals)) {
        uiStore.closeSpecificModal(modal as keyof typeof uiStore.modals);
      }
      notificationStore.info('Все модальные окна закрыты');
    },

    // Wrapper methods для уведомлений
    showNotification: notificationStore.addNotification,
    showSuccess: notificationStore.success,
    showError: notificationStore.error,
    showWarning: notificationStore.warning,
    showInfo: notificationStore.info,
    clearNotifications: notificationStore.clearNotifications,

    // Комбинированные методы
    setLoadingWithNotification: (isLoading: boolean, message?: string) => {
      uiStore.setGlobalLoading(isLoading);
      if (isLoading && message) {
        notificationStore.info('Загрузка', message);
      }
    },

    handleError: (error: string | Error, context?: string) => {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const title = context ? `Ошибка: ${context}` : 'Ошибка';

      notificationStore.error(title, errorMessage);
      uiStore.setGlobalLoading(false);
    },

    handleSuccess: (message: string, description?: string) => {
      notificationStore.success(message, description);
      uiStore.setGlobalLoading(false);
    },
  };
};

export type UseUIStoreReturn = ReturnType<typeof useUIStore>;
