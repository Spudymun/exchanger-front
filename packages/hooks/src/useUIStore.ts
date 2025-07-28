import { useUIStore as useUIStoreBase } from './state/ui-store';
import { useNotifications } from './useNotifications';

// Enhanced UI Store wrapper - интеграция с централизованной notification системой
export const useUIStore = () => {
  const uiStore = useUIStoreBase();
  const notifications = useNotifications();

  // Методы с интеграцией notification системы
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    uiStore.setTheme(theme);
    const themeNames = { light: 'светлую', dark: 'темную', system: 'системную' };
    notifications.success('Тема изменена', `Переключено на ${themeNames[theme]} тему`);
  };

  const handleError = (error: string | Error, context?: string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const title = context ? `Ошибка: ${context}` : 'Ошибка';
    notifications.error(title, errorMessage);
    uiStore.setGlobalLoading(false);
  };

  return {
    ...uiStore,
    // Notification методы из централизованной системы
    ...notifications,
    setTheme,
    handleError,
    handleSuccess: (message: string, description?: string) => {
      notifications.success(message, description);
      uiStore.setGlobalLoading(false);
    },
  };
};

export type UseUIStoreReturn = ReturnType<typeof useUIStore>;
