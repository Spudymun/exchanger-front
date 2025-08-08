/**
 * Локализованный wrapper для useNotifications
 * Следует паттерну useAuthMutations.ts - добавляет переводы к базовому функционалу
 * 
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Не изменяет базовый хук, а расширяет его переводами
 */

import { useNotifications } from '@repo/hooks/src/client-hooks';
import { useTranslations } from 'next-intl';

// Helper function для создания API уведомлений
const createApiNotifications = (
    baseNotifications: ReturnType<typeof useNotifications>,
    t: (key: string, values?: Record<string, string | number>) => string,
    API_SUCCESS_TITLE: string,
    API_ERROR_TITLE: string
) => ({
    showApiSuccess: (message?: string) => {
        baseNotifications.success(
            message || API_SUCCESS_TITLE,
            API_SUCCESS_TITLE
        );
    },
    showApiError: (message?: string) => {
        baseNotifications.error(
            message || API_ERROR_TITLE,
            API_ERROR_TITLE
        );
    },
    showApiLoading: (message?: string) => {
        baseNotifications.info(
            message || t('api.loading')
        );
    },
    showUnknownError: () => {
        baseNotifications.error(
            t('api.unknownError'),
            API_ERROR_TITLE
        );
    }
});

// Helper function для создания exchange уведомлений
const createExchangeNotifications = (
    baseNotifications: ReturnType<typeof useNotifications>,
    t: (key: string, values?: Record<string, string | number>) => string,
    API_SUCCESS_TITLE: string,
    EXCHANGE_ERROR_TITLE: string
) => ({
    showExchangeSuccess: () => {
        baseNotifications.success(
            t('exchange.success'),
            API_SUCCESS_TITLE
        );
    },
    showExchangeError: (message?: string) => {
        baseNotifications.error(
            message || t('exchange.error'),
            EXCHANGE_ERROR_TITLE
        );
    },
    showOrderCreated: (orderId: string) => {
        baseNotifications.success(
            t('exchange.orderCreated', { orderId }),
            API_SUCCESS_TITLE
        );
    },
    showOrderCompleted: (orderId: string) => {
        baseNotifications.success(
            t('exchange.orderCompleted', { orderId }),
            API_SUCCESS_TITLE
        );
    },
    showCalculationError: () => {
        baseNotifications.error(
            t('exchange.calculationError'),
            EXCHANGE_ERROR_TITLE
        );
    }
});

// Helper function для создания validation уведомлений
const createValidationNotifications = (
    baseNotifications: ReturnType<typeof useNotifications>,
    t: (key: string, values?: Record<string, string | number>) => string,
    VALIDATION_ERROR_TITLE: string
) => ({
    showValidationError: (message?: string) => {
        baseNotifications.error(
            message || t('validation.error'),
            VALIDATION_ERROR_TITLE
        );
    },
    showMultipleValidationErrors: (count: number) => {
        baseNotifications.error(
            t('validation.multipleErrors', { count }),
            VALIDATION_ERROR_TITLE
        );
    },
    showFormError: () => {
        baseNotifications.error(
            t('validation.formError'),
            VALIDATION_ERROR_TITLE
        );
    }
});

export function useNotificationsWithTranslations() {
    const baseNotifications = useNotifications();
    const t = useTranslations('notifications');

    // Константы для часто используемых переводов
    const API_SUCCESS_TITLE = t('api.success');
    const API_ERROR_TITLE = t('api.error');
    const VALIDATION_ERROR_TITLE = t('validation.error');
    const EXCHANGE_ERROR_TITLE = t('exchange.error');

    const apiNotifications = createApiNotifications(baseNotifications, t, API_SUCCESS_TITLE, API_ERROR_TITLE);
    const exchangeNotifications = createExchangeNotifications(baseNotifications, t, API_SUCCESS_TITLE, EXCHANGE_ERROR_TITLE);
    const validationNotifications = createValidationNotifications(baseNotifications, t, VALIDATION_ERROR_TITLE);

    return {
        ...baseNotifications,
        ...apiNotifications,
        ...exchangeNotifications,
        ...validationNotifications,
        showThemeChanged: (themeName: 'light' | 'dark' | 'system') => {
            const localizedThemeName = t(`theme.${themeName}`);
            baseNotifications.success(
                t('theme.changedDescription', { themeName: localizedThemeName }),
                t('theme.changed')
            );
        }
    };
}