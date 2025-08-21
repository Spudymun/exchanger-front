/**
 * Security-Enhanced Validation Schemas - Main Export File
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Центральный файл для экспорта всех security-enhanced schemas
 * НА ОСНОВЕ: Модульная архитектура для соблюдения eslint max-lines правила
 *
 * МОДУЛИ:
 * - security-enhanced-auth-schemas.ts - аутентификация
 * - security-enhanced-exchange-schemas.ts - обмен валют
 * - security-enhanced-support-schemas.ts - поддержка и админ функции
 */

// Re-export все схемы из отдельных модулей
export * from './security-enhanced-auth-schemas';
export * from './security-enhanced-exchange-schemas';
export * from './security-enhanced-support-schemas';
