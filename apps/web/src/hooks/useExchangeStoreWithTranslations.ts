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
    _validationT: (key: string, values?: Record<string, string | number>) => string
) => {
    return z.object({
        fromCurrency: currencySchema,
        fromAmount: cryptoAmountStringSchema,
        userEmail: emailSchema,
        cardNumber: z.string().min(1),
        agreementAccepted: z.boolean().refine(val => val === true)
    });
};

// Helper функции для валидации
const processValidationErrors = (
    errors: z.ZodError['errors'],
    notifications: ReturnType<typeof useNotificationsWithTranslations>
) => {
    const errorMap: Record<string, string[]> = {};

    for (const error of errors) {
        const fieldName = String(error.path[0]);
        const existingErrors = errorMap[fieldName];
        if (!existingErrors) {
            errorMap[fieldName] = [];
        }
        errorMap[fieldName].push(error.message);
    }

    const errorCount = Object.keys(errorMap).length;
    if (errorCount > 1) {
        notifications.showMultipleValidationErrors(errorCount);
    } else {
        notifications.showValidationError();
    }
};

const getFieldSchema = (fieldName: string): z.ZodSchema<unknown> => {
    switch (fieldName) {
        case 'fromCurrency':
            return currencySchema;
        case 'fromAmount':
            return cryptoAmountStringSchema;
        case 'userEmail':
            return emailSchema;
        case 'cardNumber':
            return z.string().min(1);
        default:
            return z.any();
    }
};

export function useExchangeStoreWithTranslations() {
    const baseStore = useExchangeStore();
    const notifications = useNotificationsWithTranslations();
    const validationT = useTranslations('AdvancedExchangeForm.validation');
    const exchangeT = useTranslations('exchange');

    const exchangeFormSchema = createLocalizedExchangeFormSchema(validationT);

    const validateFormWithTranslations = () => {
        const { formData, calculation } = baseStore;

        const validationData = {
            fromCurrency: formData.fromCurrency,
            fromAmount: formData.fromAmount,
            userEmail: formData.userEmail,
            cardNumber: formData.recipientData.cardNumber,
            agreementAccepted: formData.agreementAccepted
        };

        const errorMap = createNextIntlZodErrorMap({
            t: validationT,
            locale: 'current'
        });
        const result = exchangeFormSchema.safeParse(validationData, { errorMap });

        if (!result.success) {
            processValidationErrors(result.error.errors, notifications);
            return false;
        }

        if (!calculation?.isValid) {
            notifications.showCalculationError();
            return false;
        }

        return true;
    };

    const getLocalizedStepInfo = (step: number) => {
        const stepKeys = ['form', 'review', 'payment', 'completed'] as const;
        const stepKey = stepKeys[step] || 'form';

        return {
            title: exchangeT(`steps.${stepKey}.title`),
            description: exchangeT(`steps.${stepKey}.description`)
        };
    };

    const getLocalizedOrderStatus = (status: string) => {
        return exchangeT(`orderStatus.${status.toLowerCase()}`);
    };

    const validateField = (fieldName: string, value: unknown) => {
        const schema = getFieldSchema(fieldName);

        if (fieldName === 'unknown') {
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
        ...baseStore,
        validateForm: validateFormWithTranslations,
        validateField,
        getLocalizedStepInfo,
        getLocalizedOrderStatus,
        notifications,
        showOrderCreated: (orderId: string) => notifications.showOrderCreated(orderId),
        showOrderCompleted: (orderId: string) => notifications.showOrderCompleted(orderId),
        showExchangeSuccess: () => notifications.showExchangeSuccess(),
        showExchangeError: (message?: string) => notifications.showExchangeError(message)
    };
}

export type UseExchangeStoreWithTranslationsReturn = ReturnType<typeof useExchangeStoreWithTranslations>;