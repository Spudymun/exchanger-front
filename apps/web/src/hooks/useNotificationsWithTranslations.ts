/**
 * Локализованный wrapper для useNotifications
 * Следует паттерну useAuthMutations.ts - добавляет переводы к базовому функционалу
 * 
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Не изменяет базовый хук, а расширяет его переводами
 */

import { useNotifications } from '@repo/hooks/src/client-hooks';
import { useTranslations } from 'next-intl';

export function useNotificationsWithTranslations() {
    const baseNotifications = useNotifications();
    const t = useTranslations('notifications');

    return {
        ...baseNotifications,

        // Локализованные методы для API уведомлений
        showApiSuccess: (message?: string) => {
            baseNotifications.success(
                message || t('api.success'),
                t('api.success')
            );
        },

        showApiError: (message?: string) => {
            baseNotifications.error(
                message || t('api.error'),
                t('api.error')
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
                t('api.error')
            );
        },

        // Локализованные методы для темы
        showThemeChanged: (themeName: 'light' | 'dark' | 'system') => {
            const localizedThemeName = t(`theme.${themeName}`);
            baseNotifications.success(
                t('theme.changedDescription', { themeName: localizedThemeName }),
                t('theme.changed')
            );
        },

        // Локализованные методы для exchange
        showExchangeSuccess: () => {
            baseNotifications.success(
                t('exchange.success'),
                t('api.success')
            );
        },

        showExchangeError: (message?: string) => {
            baseNotifications.error(
                message || t('exchange.error'),
                t('exchange.error')
            );
        },

        showOrderCreated: (orderId: string) => {
            baseNotifications.success(
                t('exchange.orderCreated', { orderId }),
                t('api.success')
            );
        },

        showOrderCompleted: (orderId: string) => {
            baseNotifications.success(
                t('exchange.orderCompleted', { orderId }),
                t('api.success')
            );
        },

        showCalculationError: () => {
            baseNotifications.error(
                t('exchange.calculationError'),
                t('exchange.error')
            );
        },

        // Локализованные методы для валидации
        showValidationError: (message?: string) => {
            baseNotifications.error(
                message || t('validation.error'),
                t('validation.error')
            );
        },

        showMultipleValidationErrors: (count: number) => {
            baseNotifications.error(
                t('validation.multipleErrors', { count }),
                t('validation.error')
            );
        },

        showFormError: () => {
            baseNotifications.error(
                t('validation.formError'),
                t('validation.error')
            );
        }
    };
}