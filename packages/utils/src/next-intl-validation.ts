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
 * ПОЧЕМУ АРХИТЕКТУРА РАБОТАЕТ ПРАВИЛЬНО:
 *
 * 1. ФОРМЫ используют useTranslations('FormName') → создают функцию t с префиксом
 * 2. ZOD СХЕМЫ используют createNextIntlZodErrorMap(t) → получают локализованные ошибки
 * 3. HANDLERS используют ключи типа 'validation.field.error' → next-intl добавляет префикс автоматически
 * 4. JSON ПЕРЕВОДЫ содержат структуру FormName.validation.field.error → ключи находятся
 * 5. РЕЗУЛЬТАТ: полностью локализованная валидация без хардкода
 *
 * Этот файл служит точкой входа для обратной совместимости
 */

// Реэкспорт всех функций из модулей
export * from './validation';
