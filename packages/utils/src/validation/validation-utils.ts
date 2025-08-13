/**
 * Централизованные утилиты для валидации
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Устранение дублирования логики проверок
 */

/**
 * Проверка на пустое значение (строка)
 * Заменяет дублированную логику: !value || value.trim() === ''
 */
export function isEmptyString(value: unknown): boolean {
  return !value || String(value).trim() === '';
}

/**
 * Проверка на пустое значение (строгая)
 * Для случаев, когда нужна проверка на null/undefined
 */
export function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || isEmptyString(value);
}

/**
 * Безопасное получение строки для валидации
 * Заменяет String(fieldValue).trim() === '' паттерн
 */
export function toValidationString(value: unknown): string {
  return String(value || '').trim();
}

/**
 * Проверка на пустую строку после trim
 * Унифицированная логика для всех проверок пустых значений
 */
export function isEmptyAfterTrim(value: unknown): boolean {
  return toValidationString(value) === '';
}
