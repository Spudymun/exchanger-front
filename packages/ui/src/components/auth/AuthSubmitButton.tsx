import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { Button } from '../ui/button';

/**
 * Переиспользуемая кнопка отправки для форм аутентификации - ИСПРАВЛЕННАЯ
 * Унифицирует поведение и стили с реактивным состоянием
 */
interface AuthSubmitButtonProps<T extends Record<string, unknown> = Record<string, unknown>> {
    form: UseFormReturn<T>;
    isLoading: boolean;
    t: (key: string) => string;
}

export const AuthSubmitButton = <T extends Record<string, unknown> = Record<string, unknown>>({
    form,
    isLoading,
    t
}: AuthSubmitButtonProps<T>) => {
    // Валидация обязательных пропсов
    if (!form) {
        throw new Error('AuthSubmitButton: form prop is required');
    }
    if (typeof isLoading !== 'boolean') {
        throw new Error('AuthSubmitButton: isLoading must be a boolean');
    }
    if (typeof t !== 'function') {
        throw new Error('AuthSubmitButton: t must be a function');
    }

    // ИСПРАВЛЕНИЕ: Более точная проверка состояния формы
    // Учитываем не только общую валидность, но и отсутствие ошибок
    const isFormValid = form.isValid && Object.keys(form.errors).length === 0;

    return (
        <Button
            type="submit"
            className="submit-button"
            disabled={isLoading || !isFormValid}
        >
            {isLoading ? t('submitting') : t('submit')}
        </Button>
    );
};
