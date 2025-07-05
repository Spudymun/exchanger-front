import { useNotificationStore } from './state/notification-store.js';
import { useUIStore as useUIStoreBase } from './state/ui-store.js';

// Enhanced UI Store wrapper - оптимизированная версия
export const useUIStore = () => {
  const uiStore = useUIStoreBase();
  const notificationStore = useNotificationStore();

  // Базовые методы с интеграцией
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    uiStore.setTheme(theme);
    const themeNames = { light: 'светлую', dark: 'темную', system: 'системную' };
    notificationStore.success('Тема изменена', `Переключено на ${themeNames[theme]} тему`);
  };

  const handleError = (error: string | Error, context?: string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const title = context ? `Ошибка: ${context}` : 'Ошибка';
    notificationStore.error(title, errorMessage);
    uiStore.setGlobalLoading(false);
  };

  return {
    ...uiStore,
    ...notificationStore,
    setTheme,
    handleError,
    handleSuccess: (message: string, description?: string) => {
      notificationStore.success(message, description);
      uiStore.setGlobalLoading(false);
    },
  };
};

export type UseUIStoreReturn = ReturnType<typeof useUIStore>;
