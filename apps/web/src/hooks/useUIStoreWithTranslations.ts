/**
 * Локализованный wrapper для useUIStore
 * Следует паттерну useAuthMutations.ts - добавляет переводы к базовому функционалу
 * 
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: 
 * - Добавляет локализованные уведомления при смене темы
 * - Не изменяет базовую логику UI store
 * - Интегрируется с системой уведомлений
 */

import { type ThemeMode } from '@repo/constants';
import { useUIStore } from '@repo/hooks/src/client-hooks';

import { useNotificationsWithTranslations } from './useNotificationsWithTranslations';

export function useUIStoreWithTranslations() {
    const baseUIStore = useUIStore();
    const notifications = useNotificationsWithTranslations();

    // Локализованный метод смены темы с уведомлением
    const setThemeWithNotification = (theme: ThemeMode) => {
        baseUIStore.setTheme(theme);
        notifications.showThemeChanged(theme);
    };

    // Локализованный toggle для темы с уведомлением
    const toggleThemeWithNotification = () => {
        const currentTheme = baseUIStore.theme;
        let newTheme: ThemeMode;

        switch (currentTheme) {
            case 'light':
                newTheme = 'dark';
                break;
            case 'dark':
                newTheme = 'system';
                break;
            case 'system':
            default:
                newTheme = 'light';
                break;
        }

        setThemeWithNotification(newTheme);
    };

    return {
        // Все методы и свойства базового UI store
        ...baseUIStore,

        // Переопределяем setTheme с уведомлениями
        setTheme: setThemeWithNotification,

        // Добавляем новый метод toggle с уведомлениями
        toggleThemeWithNotification,

        // Локализованные уведомления
        notifications
    };
}

export type UseUIStoreWithTranslationsReturn = ReturnType<typeof useUIStoreWithTranslations>;