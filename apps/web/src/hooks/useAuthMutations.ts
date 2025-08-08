/**
 * Основные мутации авторизации (login, register)
 */
import { useNotifications } from '@repo/hooks/src/client-hooks';
import { useTranslations } from 'next-intl';

import { trpc } from '../../lib/trpc-provider';

export function useAuthMutations(): {
    login: ReturnType<typeof trpc.auth.login.useMutation>;
    register: ReturnType<typeof trpc.auth.register.useMutation>;
    logout: ReturnType<typeof trpc.auth.logout.useMutation>;
} {
    const utils = trpc.useUtils();
    const notifications = useNotifications();
    const t = useTranslations('Layout.auth.messages');

    const login = trpc.auth.login.useMutation({
        onSuccess: () => {
            notifications.success(t('loginSuccess'), t('loginSuccessDescription'));
            utils.auth.getSession.invalidate();
        },
        onError: (error: unknown) => {
            notifications.handleApiError(error, t('loginError'));
        },
    });

    const register = trpc.auth.register.useMutation({
        onSuccess: () => {
            notifications.success(t('registerSuccess'), t('registerSuccessDescription'));
        },
        onError: (error: unknown) => {
            notifications.handleApiError(error, t('registerError'));
        },
    });

    const logout = trpc.auth.logout.useMutation({
        onSuccess: () => {
            notifications.success(t('logoutSuccess'), t('logoutSuccessDescription'));
            utils.auth.getSession.invalidate();
        },
        onError: (error: unknown) => {
            notifications.handleApiError(error, t('logoutError'));
        },
    });

    return { login, register, logout };
}
