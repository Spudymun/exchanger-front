/**
 * Next-intl integrated validation system - МОДУЛЬНАЯ АРХИТЕКТУРА
 * 
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Разделен на модули для лучшей поддерживаемости
 * - validation/constants.ts - Константы и типы
 * - validation/handlers.ts - Обработчики валидации полей
 * - validation/core.ts - Основные функции валидации
 * - validation/single-field.ts - Валидация отдельных полей
 * - validation/field-validation.ts - Валидация полей формы
 * - validation/hooks.ts - React хуки
 * 
 * Этот файл служит точкой входа для обратной совместимости
 */

// Реэкспорт всех функций из модулей
export * from './validation';