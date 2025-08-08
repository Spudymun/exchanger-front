import { UI_NUMERIC_CONSTANTS, BUSINESS_LIMITS } from '@repo/constants';

import { useNotifications } from '../useNotifications';

interface AuthUser {
  id: string;
  email: string;
  isVerified: boolean;
  role?: string; // Роль пользователя для проверки прав
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
 * УСТАРЕЛ: Этот хук использовал хардкоженные сообщения.
 * Теперь используйте локализованные уведомления напрямую в компонентах через useTranslations.
 * 
 * @deprecated Используйте useAuthMutations с локализованными переводами
 */
export function useEnhancedAuth(baseAuth: AuthContextType) {
  const notifications = useNotifications();

  return {
    ...baseAuth,
    login: createLoginWithNotifications(baseAuth, notifications),
    register: createRegisterWithNotifications(baseAuth, notifications),
    logout: createLogoutWithNotifications(baseAuth, notifications),
    hasPermission: usePermissionChecker(baseAuth),
    requireAuth: () => baseAuth.isLoggedIn,
  };
}

// Helper function: Login with notifications
function createLoginWithNotifications(
  baseAuth: AuthContextType,
  notifications: ReturnType<typeof useNotifications>
) {
  return async (email: string, password: string) => {
    try {
      await baseAuth.login(email, password);
      // DEPRECATED: Use localized translations in components
      notifications.success('Welcome!', `Logged in as ${email}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : UI_NUMERIC_CONSTANTS.DEFAULT_ERROR_MESSAGE;
      notifications.error('Login error', errorMessage);
      throw error;
    }
  };
}

// Helper function: Register with notifications
function createRegisterWithNotifications(
  baseAuth: AuthContextType,
  notifications: ReturnType<typeof useNotifications>
) {
  return async (email: string, password: string) => {
    try {
      await baseAuth.register(email, password);
      notifications.success(
        'Registration successful!',
        'Check your email to confirm your account',
        {
          duration: BUSINESS_LIMITS.ERROR_NOTIFICATION_DURATION_MS,
        }
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : UI_NUMERIC_CONSTANTS.DEFAULT_ERROR_MESSAGE;
      notifications.error('Registration error', errorMessage);
      throw error;
    }
  };
}

// Helper function: Logout with notifications  
function createLogoutWithNotifications(
  baseAuth: AuthContextType,
  notifications: ReturnType<typeof useNotifications>
) {
  return async () => {
    try {
      await baseAuth.logout();
      notifications.info('Logged out', 'Goodbye!');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : UI_NUMERIC_CONSTANTS.DEFAULT_ERROR_MESSAGE;
      notifications.error('Logout error', errorMessage);
    }
  };
}

// Separate permission checker to reduce main function size
function usePermissionChecker(baseAuth: AuthContextType) {
  return (permission: string) => {
    if (!baseAuth.isLoggedIn || !baseAuth.user) return false;

    // ИСПРАВЛЕНО: Безопасная проверка прав через роль пользователя
    const isAdmin = baseAuth.user.role === 'admin';

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
