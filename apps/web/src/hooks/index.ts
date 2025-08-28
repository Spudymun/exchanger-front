/**
 * Локализованные hooks для web приложения
 *
 * АРХИТЕКТУРНЫЙ ПРИНЦИП:
 * - Все hooks следуют паттерну wrapper'ов
 * - Используют существующую систему next-intl + Zod
 * - Не дублируют логику, а добавляют локализацию
 * - Интегрируются с централизованными системами
 */

// Локализованные wrapper hooks
export { useNotificationsWithTranslations } from './useNotificationsWithTranslations';
export { useUIStoreWithTranslations } from './useUIStoreWithTranslations';

// Типы для TypeScript
export type { UseUIStoreWithTranslationsReturn } from './useUIStoreWithTranslations';
