'use client';

import * as React from 'react';

import { useAuthModal } from './auth-modal-provider';

/**
 * Унифицированный hook для auth-protected страниц
 * 
 * Объединяет:
 * 1. Логику модалки и редиректа из useAuthProtection
 * 2. Компонент ErrorState для отображения ошибок запросов
 * 
 * Обеспечивает:
 * - Автоматическое открытие модалки при UNAUTHORIZED ошибке
 * - Редирект при закрытии модалки без авторизации
 * - Переиспользуемый компонент для рендера ошибок
 * 
 * @example
 * ```tsx
 * function MyProtectedPage() {
 *   const router = useRouter();
 *   const { data: session } = trpc.auth.getSession.useQuery();
 *   const { onAuthRequired } = useAuthProtectedPage({
 *     onRedirect: () => router.push('/'),
 *     session
 *   });
 * 
 *   const { data, error } = trpc.myQuery.useQuery();
 *   
 *   if (error) {
 *     return (
 *       <AuthErrorState 
 *         error={error}
 *         translations={{
 *           fetchFailed: t('errors.fetchFailed'),
 *           unauthorizedMessage: tErrors('server.errors.auth.required')
 *         }}
 *         onLoginRequired={onAuthRequired}
 *       />
 *     );
 *   }
 * 
 *   // Mutations
 *   const mutation = trpc.mutation.useMutation({
 *     onError: (err) => {
 *       if (isUnauthorized(err)) {
 *         onAuthRequired();
 *       }
 *     }
 *   });
 * 
 *   return <div>{data}</div>;
 * }
 * ```
 */

export interface UseAuthProtectedPageParams {
  /** Callback для редиректа при закрытии модалки без авторизации */
  onRedirect: () => void;
  /** Текущая сессия пользователя */
  session?: { user?: unknown } | null;
}

export interface AuthErrorStateProps {
  /** Ошибка запроса */
  error: Error & { data?: { code?: string } };
  /** Переводы для сообщений */
  translations: {
    fetchFailed: string;
    unauthorizedMessage: string;
  };
}

export interface UseAuthProtectedPageReturn {
  /** Callback для вызова при UNAUTHORIZED в mutations */
  onAuthRequired: () => void;
}

/**
 * Helper: Проверить является ли ошибка UNAUTHORIZED
 * 
 * КРИТИЧНО: Проверяем ТОЛЬКО error.data.code, НЕ message!
 * Проверка message.includes() может ложно срабатывать для других ошибок (NOT_FOUND, FORBIDDEN)
 */
function isUnauthorizedError(error: Error & { data?: { code?: string } }): boolean {
  return error.data?.code === 'UNAUTHORIZED';
}

/**
 * Hook: Логика отслеживания модалки и редиректа
 */
function useAuthModalTracking(
  authModal: ReturnType<typeof useAuthModal>,
  session: { user?: unknown } | null | undefined,
  onRedirect: () => void
) {
  const wasModalOpenRef = React.useRef(false);

  // Отслеживаем открытие модалки
  React.useEffect(() => {
    if (authModal.isLoginOpen || authModal.isRegisterOpen || authModal.isForgotPasswordOpen) {
      wasModalOpenRef.current = true;
    }
  }, [authModal.isLoginOpen, authModal.isRegisterOpen, authModal.isForgotPasswordOpen]);

  // Редирект если закрыли модалку без авторизации
  React.useEffect(() => {
    const allModalsClosed =
      !authModal.isLoginOpen && !authModal.isRegisterOpen && !authModal.isForgotPasswordOpen;

    if (wasModalOpenRef.current && allModalsClosed && !session?.user) {
      // ✅ ИСПРАВЛЕНО: закрываем все модалки перед редиректом
      authModal.closeAll();
      onRedirect();
    }

    if (wasModalOpenRef.current && allModalsClosed) {
      wasModalOpenRef.current = false;
    }
  }, [
    authModal,
    authModal.isLoginOpen,
    authModal.isRegisterOpen,
    authModal.isForgotPasswordOpen,
    session,
    onRedirect,
  ]);
}

export function useAuthProtectedPage({
  onRedirect,
  session,
}: UseAuthProtectedPageParams): UseAuthProtectedPageReturn {
  const authModal = useAuthModal();

  // Отслеживание модалки и редирект
  useAuthModalTracking(authModal, session, onRedirect);

  // Возвращаем callback для открытия модалки + компонент
  return {
    onAuthRequired: authModal.openLogin,
  };
}

// ⚡ КОМПОНЕНТ для рендера ошибок (НЕ внутри hook - избегаем замыканий!)
export function AuthErrorState({ 
  error, 
  translations,
  onLoginRequired 
}: AuthErrorStateProps & { onLoginRequired: () => void }) {
  // Автоматически открываем модалку при UNAUTHORIZED
  React.useEffect(() => {
    if (isUnauthorizedError(error)) {
      onLoginRequired();
    }
  }, [error, onLoginRequired]);

  const errorMessage = isUnauthorizedError(error)
    ? translations.unauthorizedMessage
    : error.message;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-destructive text-lg">{translations.fetchFailed}</p>
      <p className="text-sm text-muted-foreground">{errorMessage}</p>
    </div>
  );
}
