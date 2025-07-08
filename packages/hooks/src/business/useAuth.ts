import { UI_NUMERIC_CONSTANTS, BUSINESS_LIMITS } from '@repo/constants';

import { useNotifications } from '../useNotifications.js';

interface AuthUser {
  id: string;
  email: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Enhanced Auth Hook
 *
 * Integrates with existing AuthProvider and adds business logic
 * Note: This hook expects AuthProvider to be available in the React context
 */
export function useEnhancedAuth(baseAuth: AuthContextType) {
  const notifications = useNotifications();

  // Extended login with notifications and redirect
  const loginWithNotifications = async (email: string, password: string) => {
    try {
      await baseAuth.login(email, password);
      notifications.success('Добро пожаловать!', `Вы вошли как ${email}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : UI_NUMERIC_CONSTANTS.DEFAULT_ERROR_MESSAGE;
      notifications.error('Ошибка входа', errorMessage);
      throw error;
    }
  };

  // Extended register with notifications
  const registerWithNotifications = async (email: string, password: string) => {
    try {
      await baseAuth.register(email, password);
      notifications.success('Регистрация успешна!', 'Проверьте email для подтверждения аккаунта', {
        duration: BUSINESS_LIMITS.ERROR_NOTIFICATION_DURATION_MS,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : UI_NUMERIC_CONSTANTS.DEFAULT_ERROR_MESSAGE;
      notifications.error('Ошибка регистрации', errorMessage);
      throw error;
    }
  };

  // Extended logout with notifications
  const logoutWithNotifications = async () => {
    try {
      await baseAuth.logout();
      notifications.info('Выход выполнен', 'До свидания!');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : UI_NUMERIC_CONSTANTS.DEFAULT_ERROR_MESSAGE;
      notifications.error('Ошибка выхода', errorMessage);
    }
  };

  return {
    ...baseAuth,
    login: loginWithNotifications,
    register: registerWithNotifications,
    logout: logoutWithNotifications,
    hasPermission: usePermissionChecker(baseAuth),
    requireAuth: () => baseAuth.isLoggedIn,
  };
}

// Separate permission checker to reduce main function size
function usePermissionChecker(baseAuth: AuthContextType) {
  return (permission: string) => {
    if (!baseAuth.isLoggedIn || !baseAuth.user) return false;

    const isAdmin = baseAuth.user.email.includes('admin');

    switch (permission) {
      case 'admin':
        return isAdmin;
      case 'verified':
        return baseAuth.user.isVerified;
      case 'user':
        return true;
      default:
        return false;
    }
  };
}
