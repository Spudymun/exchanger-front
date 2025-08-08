/**
 * Локализованный wrapper для useExchangeStore
 * Следует паттерну useAuthMutations.ts - добавляет переводы к базовому функционалу
 * 
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: 
 * - Использует существующую систему createNextIntlZodErrorMap
 * - Не дублирует логику валидации, а локализует сообщения
 * - Интегрируется с централизованными Zod схемами
 */

import { useExchangeStore } from '@repo/hooks/src/client-hooks';
import {
    createNextIntlZodErrorMap,
    emailSchema,
    cryptoAmountStringSchema,
    currencySchema
} from '@repo/utils';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { useNotificationsWithTranslations } from './useNotificationsWithTranslations';

// Создаем локализованную схему для exchange формы
const createLocalizedExchangeFormSchema = (
    validationT: (key: string, values?: Record<string, string | number>) => string,
    exchangeT: (key: string, values?: Record<string, string | number>) => string
) => {
    const errorMap = createNextIntlZodErrorMap({
        t: validationT,
        locale: 'current'
    });

    return z.object({
        fromCurrency: currencySchema,
        fromAmount: cryptoAmountStringSchema,
        userEmail: emailSchema,
        cardNumber: z.string().min(1),
        agreementAccepted: z.boolean().refine(val => val === true)
    });
};

export function useExchangeStoreWithTranslations() {
    const baseStore = useExchangeStore();
    const notifications = useNotificationsWithTranslations();
    const validationT = useTranslations('AdvancedExchangeForm.validation');
    const exchangeT = useTranslations('exchange');

    // Создаем локализованную схему валидации
    const exchangeFormSchema = createLocalizedExchangeFormSchema(validationT, exchangeT);

    // Локализованная функция валидации
    const validateFormWithTranslations = () => {
        const { formData, calculation } = baseStore;

        // Подготавливаем данные для валидации
        const validationData = {
            fromCurrency: formData.fromCurrency,
            fromAmount: formData.fromAmount,
            userEmail: formData.userEmail,
            cardNumber: formData.recipientData.cardNumber,
            agreementAccepted: formData.agreementAccepted
        };

        // Валидируем с помощью локализованной схемы
        const errorMap = createNextIntlZodErrorMap({
            t: validationT,
            locale: 'current'
        });
        const result = exchangeFormSchema.safeParse(validationData, { errorMap });

        if (!result.success) {
            // Преобразуем ошибки Zod в формат для уведомлений
            const errors: Record<string, string[]> = {};

            for (const error of result.error.errors) {
                const fieldName = error.path[0] as string;
                if (!errors[fieldName]) {
                    errors[fieldName] = [];
                }
                errors[fieldName].push(error.message);
            }

            // Показываем ошибки через локализованные уведомления
            const errorCount = Object.keys(errors).length;
            if (errorCount > 1) {
                notifications.showMultipleValidationErrors(errorCount);
            } else {
                notifications.showValidationError();
            }

            return false;
        }

        // Дополнительная проверка расчета
        if (!calculation?.isValid) {
            notifications.showCalculationError();
            return false;
        }

        return true;
    };

    // Локализованные helper методы
    const getLocalizedStepInfo = (step: number) => {
        const stepKeys = ['form', 'review', 'payment', 'completed'];
        const stepKey = stepKeys[step] || 'form';

        return {
            title: exchangeT(`steps.${stepKey}.title`),
            description: exchangeT(`steps.${stepKey}.description`)
        };
    };

    const getLocalizedOrderStatus = (status: string) => {
        return exchangeT(`orderStatus.${status.toLowerCase()}`);
    };

    // Локализованные методы валидации отдельных полей
    const validateField = (fieldName: string, value: unknown) => {
        let schema: z.ZodSchema<unknown>;

        switch (fieldName) {
            case 'fromCurrency':
                schema = currencySchema;
                break;
            case 'fromAmount':
                schema = cryptoAmountStringSchema;
                break;
            case 'userEmail':
                schema = emailSchema;
                break;
            case 'cardNumber':
                schema = z.string().min(1);
                break;
            default:
                return { isValid: true, error: null };
        }

        const errorMap = createNextIntlZodErrorMap({
            t: validationT,
            locale: 'current'
        });

        const result = schema.safeParse(value, { errorMap });

        if (result.success) {
            return { isValid: true, error: null };
        }

        const firstError = result.error.errors[0];
        return {
            isValid: false,
            error: firstError ? firstError.message : validationT('invalid')
        };
    };

    return {
        // Все методы и свойства базового store
        ...baseStore,

        // Переопределяем validateForm с локализацией
        validateForm: validateFormWithTranslations,

        // Добавляем локализованные методы
        validateField,
        getLocalizedStepInfo,
        getLocalizedOrderStatus,

        // Локализованные уведомления
        notifications,

        // Локализованные методы для работы с заказами
        showOrderCreated: (orderId: string) => {
            notifications.showOrderCreated(orderId);
        },

        showOrderCompleted: (orderId: string) => {
            notifications.showOrderCompleted(orderId);
        },

        showExchangeSuccess: () => {
            notifications.showExchangeSuccess();
        },

        showExchangeError: (message?: string) => {
            notifications.showExchangeError(message);
        }
    };
}

export type UseExchangeStoreWithTranslationsReturn = ReturnType<typeof useExchangeStoreWithTranslations>;