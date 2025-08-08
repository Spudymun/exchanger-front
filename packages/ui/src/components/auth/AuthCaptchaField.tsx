import { AUTH_CAPTCHA_CONFIG } from '@repo/constants';
import { UseFormReturn } from '@repo/hooks';
import React from 'react';

import { useMathCaptchaLocal, CAPTCHA_CONFIGS_LOCAL } from '../../lib/useMathCaptchaLocal';
import { FormField, FormMessage } from '../ui/form';
import { MathCaptcha } from '../ui/math-captcha';

/**
 * Переиспользуемое поле CAPTCHA для форм аутентификации - ИСПРАВЛЕННАЯ АРХИТЕКТУРА
 * Использует централизованную конфигурацию из констант
 * Устранена избыточность двойного поля captcha/captchaVerified
 */
interface CaptchaFormFields {
    captcha: string;
    // Убрано: captchaVerified - избыточность устранена
}

interface AuthCaptchaFieldProps<T extends CaptchaFormFields = CaptchaFormFields> {
    form: UseFormReturn<T>;
    isLoading: boolean;
    t: (key: string) => string;
}

export const AuthCaptchaField = <T extends CaptchaFormFields = CaptchaFormFields>({
    form,
    isLoading,
    t
}: AuthCaptchaFieldProps<T>) => {
    // Use local CAPTCHA hook to avoid dependency on @repo/hooks
    const config = CAPTCHA_CONFIGS_LOCAL[AUTH_CAPTCHA_CONFIG.DIFFICULTY] || CAPTCHA_CONFIGS_LOCAL.medium;
    const captcha = useMathCaptchaLocal(config);

    // Объединяем ошибки от captcha поля (теперь все ошибки идут сюда)
    const captchaError = form.errors.captcha;

    // Мемоизированный callback для обновления формы - БЕЗ ЦИКЛИЧЕСКИХ ЗАВИСИМОСТЕЙ
    const updateCaptchaValue = React.useCallback((value: string) => {
        form.setValue('captcha', value);
    }, [form.setValue]);

    const clearCaptchaError = React.useCallback(() => {
        if (form.clearError) {
            form.clearError('captcha');
        }
    }, [form.clearError]);

    const setCaptchaError = React.useCallback((message: string) => {
        if (form.setError) {
            form.setError('captcha', message);
        }
    }, [form.setError]);

    // ИСПРАВЛЕНИЕ: Разделяем логику на отдельные useEffect для избежания циклов
    
    // 1. Обновление значения при изменении ответа пользователя
    React.useEffect(() => {
        updateCaptchaValue(captcha.userAnswer);
    }, [captcha.userAnswer, updateCaptchaValue]);

    // 2. Очистка ошибки при успешной верификации
    React.useEffect(() => {
        if (captcha.isVerified) {
            clearCaptchaError();
        }
    }, [captcha.isVerified, clearCaptchaError]);

    // 3. Установка ошибки при неверном ответе (только после blur)
    React.useEffect(() => {
        if (captcha.hasError && captcha.userAnswer.trim() !== '') {
            setCaptchaError(t('error'));
        }
    }, [captcha.hasError, captcha.userAnswer, setCaptchaError, t]);

    return (
        <FormField name="captcha" error={captchaError}>
            <MathCaptcha
                name="captcha"
                question={captcha.challenge.question}
                userAnswer={captcha.userAnswer}
                isVerified={captcha.isVerified}
                hasError={captcha.hasError}
                onAnswerChange={captcha.setUserAnswer}
                onBlur={captcha.onBlur}
                onRefresh={captcha.refreshChallenge}
                disabled={isLoading}
                hideLabel={AUTH_CAPTCHA_CONFIG.HIDE_LABEL}
                labels={{
                    question: t('question'),
                    placeholder: t('placeholder'),
                    refresh: t('refresh'),
                    verification: t('verification'),
                    error: t('error'),
                }}
            />
            <FormMessage />
        </FormField>
    );
};