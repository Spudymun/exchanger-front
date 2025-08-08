'use client';

import { useAuthMutations } from './useAuthMutations';
import { usePasswordMutations } from './usePasswordMutations';

type AuthMutationAdapterReturn = ReturnType<typeof useAuthMutations> & ReturnType<typeof usePasswordMutations>;

/**
 * ПРАВИЛЬНАЯ АРХИТЕКТУРА: Композиция мутаций авторизации
 * Убираем избыточную абстракцию useAuthMutation
 * Интегрируем напрямую с системой уведомлений
 */
export function useAuthMutationAdapter(): AuthMutationAdapterReturn {
    const { login, register, logout } = useAuthMutations();
    const { requestPasswordReset, resetPassword, verifyEmail } = usePasswordMutations();

    return { login, register, logout, requestPasswordReset, resetPassword, verifyEmail };
}