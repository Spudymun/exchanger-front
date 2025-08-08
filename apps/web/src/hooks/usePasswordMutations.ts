/**
 * Мутации восстановления пароля и верификации
 */
import { useNotifications } from '@repo/hooks/src/client-hooks';
import { useTranslations } from 'next-intl';

import { trpc } from '../../lib/trpc-provider';

export function usePasswordMutations(): {
    requestPasswordReset: ReturnType<typeof trpc.auth.requestPasswordReset.useMutation>;
    resetPassword: ReturnType<typeof trpc.auth.resetPassword.useMutation>;
    verifyEmail: ReturnType<typeof trpc.auth.verifyEmail.useMutation>;
} {
    const notifications = useNotifications();
    const t = useTranslations('Layout.auth.messages');
    
    const requestPasswordReset = trpc.auth.requestPasswordReset.useMutation({
        onSuccess: () => notifications.success(t('passwordResetSent'), t('passwordResetSentDescription')),
        onError: (error: unknown) => notifications.handleApiError(error, 'password reset'),
    });

    const resetPassword = trpc.auth.resetPassword.useMutation({
        onSuccess: () => notifications.success(t('passwordChanged'), t('passwordChangedDescription')),
        onError: (error: unknown) => notifications.handleApiError(error, 'password change'),
    });

    const verifyEmail = trpc.auth.verifyEmail.useMutation({
        onSuccess: () => notifications.success(t('emailVerified'), t('emailVerifiedDescription')),
        onError: (error: unknown) => notifications.handleApiError(error, 'email verification'),
    });

    return { requestPasswordReset, resetPassword, verifyEmail };
}
