'use client';

// Импорты удалены - функция useAuthFormConfig больше не нужна

// УДАЛЕНО: useAuthFormConfig() - неиспользуемая функция
// Локаль управляется автоматически через next-intl routing

/**
 * Централизованная обработка успешной отправки формы
 */
export function createAuthFormSubmitHandler(
    onSuccess?: () => void
) {
    return () => {
        onSuccess?.();
    };
}

/**
 * Централизованная обработка ошибок формы
 */
export function createAuthFormErrorHandler() {
    return (_error: unknown) => {
        // Ошибки обрабатываются централизованным хуком useAuthMutationAdapter
        // console.error удален согласно CODE_STYLE_GUIDE.md (no-console: error)
    };
}