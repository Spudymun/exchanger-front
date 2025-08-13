import { DECIMAL_PRECISION } from '@repo/constants';
import { getCurrencyDecimals, type CryptoCurrency } from '@repo/exchange-core';

// server-i18n-errors removed - use direct fallback messages
import { validateWithZodSchemaUI } from './validation';
import { cryptoAmountStringSchema, uahAmountStringSchema } from './validation-schemas';

/**
 * INPUT VALIDATION UTILITIES - ИНТЕГРИРОВАНО С ZOD СХЕМАМИ
 * AC 5.1-5.4: Numeric input validation with decimal precision control
 *
 * ИНТЕГРАЦИЯ: Использует централизованные Zod схемы для финальной валидации
 * UI REGEX: Простые regex для проверки символов в реальном времени остаются
 */

/**
 * Check if character is allowed for numeric input
 * ПРИМЕЧАНИЕ: Простой regex для UI остается - это проверка символов в реальном времени
 */
function isNumericChar(char: string): boolean {
  return /[0-9.]/.test(char);
}

/**
 * Check if decimal point is already present in value
 */
function hasDecimalPoint(value: string): boolean {
  return value.includes('.');
}

/**
 * Count decimal places in current value
 */
function countDecimalPlaces(value: string): number {
  const parts = value.split('.');
  return parts.length > 1 ? (parts[1]?.length ?? 0) : 0;
}

/**
 * Get maximum decimal places for currency
 */
function getMaxDecimals(currency?: string): number {
  return currency
    ? getCurrencyDecimals(currency as CryptoCurrency)
    : DECIMAL_PRECISION.CRYPTO_DECIMAL_PLACES;
}

/**
 * Validate decimal point input
 */
function isDecimalPointValid(char: string, currentValue: string): boolean {
  return char === '.' && !hasDecimalPoint(currentValue);
}

/**
 * Validate digit after decimal point
 */
function isDecimalDigitValid(currentValue: string, currency?: string): boolean {
  if (!hasDecimalPoint(currentValue)) return true;

  const maxDecimals = getMaxDecimals(currency);
  const currentDecimals = countDecimalPlaces(currentValue);

  return currentDecimals < maxDecimals;
}

/**
 * Validate numeric input for crypto amounts
 * Uses existing DECIMAL_PRECISION constants for consistency
 */
export function validateNumericInput(
  event: React.KeyboardEvent<HTMLInputElement>,
  currentValue: string,
  currency?: string
): boolean {
  const char = event.key;

  // Allow control keys (backspace, delete, arrows, etc.)
  if (char.length !== 1) return true;

  // Only allow numeric characters and decimal point
  if (!isNumericChar(char)) return false;

  // Handle decimal point validation
  if (char === '.') return isDecimalPointValid(char, currentValue);

  // Handle digit after decimal point
  return isDecimalDigitValid(currentValue, currency);
}

/**
 * Format input value according to decimal precision rules
 * Integrates with existing formatCryptoAmountForUI utility
 */
export function formatInputValue(value: string, currency?: string): string {
  if (!value) return '';

  const maxDecimals = getMaxDecimals(currency);
  const parts = value.split('.');

  if (parts.length === 1) {
    return parts[0] ?? '';
  }

  // Limit decimal places
  const decimals = parts[1]?.slice(0, maxDecimals) ?? '';
  return `${parts[0] ?? ''}.${decimals}`;
}

/**
 * Custom hook for numeric input validation
 * Combines validation and formatting for clean component integration
 */
export function useNumericInput(currency?: string) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => {
    const isValid = validateNumericInput(event, currentValue, currency);

    if (!isValid) {
      event.preventDefault();
    }
  };

  const formatValue = (value: string) => {
    return formatInputValue(value, currency);
  };

  return {
    handleKeyDown,
    formatValue,
  };
}
// === ИНТЕГРАЦИЯ С ZOD СХЕМАМИ ===

/**
 * Валидирует crypto сумму используя централизованную Zod схему
 * Интеграция UI валидации с бизнес-логикой
 */
export function validateCryptoAmountWithZod(value: string): {
  isValid: boolean;
  error: string | null;
} {
  return validateWithZodSchemaUI(cryptoAmountStringSchema, value);
}

/**
 * Валидирует UAH сумму используя централизованную Zod схему
 * Интеграция UI валидации с бизнес-логикой
 */
export function validateUahAmountWithZod(value: string): {
  isValid: boolean;
  error: string | null;
} {
  return validateWithZodSchemaUI(uahAmountStringSchema, value);
}

/**
 * Расширенный хук с интеграцией Zod валидации
 * Объединяет UI проверки с бизнес-валидацией
 */
export function useNumericInputWithZod(currency?: string, isCrypto: boolean = true) {
  const basicHook = useNumericInput(currency);

  const validateWithZod = (value: string) => {
    return isCrypto ? validateCryptoAmountWithZod(value) : validateUahAmountWithZod(value);
  };

  return {
    ...basicHook,
    validateWithZod,
  };
}
