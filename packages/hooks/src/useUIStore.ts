import { useUIStore as useUIStoreBase } from './state/ui-store';
import { useNotifications } from './useNotifications';

// Enhanced UI Store wrapper - интеграция с централизованной notification системой
export const useUIStoreEnhanced = () => {
  const uiStore = useUIStoreBase();
  const notifications = useNotifications();

  // Методы с интеграцией notification системы
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    uiStore.setTheme(theme);
    const themeNames = { light: 'light', dark: 'dark', system: 'system' };
    notifications.success('Theme changed', `Switched to ${themeNames[theme]} theme`);
  };

  const handleError = (error: string | Error, context?: string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const title = context ? `Error: ${context}` : 'Error';
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

export type UseUIStoreEnhancedReturn = ReturnType<typeof useUIStoreEnhanced>;

// Export for backward compatibility and consistent naming
export const useUIStore = useUIStoreEnhanced;
