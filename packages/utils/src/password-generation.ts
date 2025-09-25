import { VALIDATION_LIMITS } from '@repo/constants';

const DEFAULT_EXTRA_LENGTH = 4;
const CHARSET_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CHARSET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET_DIGITS = '0123456789';
const CHARSET_SYMBOLS = '!@#$%^&*';
const CHARSET_ALL = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGITS + CHARSET_SYMBOLS;

/**
 * Генерирует криптографически стойкий пароль для автоматической регистрации
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: ГАРАНТИРОВАННОЕ соответствие passwordSchema БЕЗ дополнительных проверок
 *
 * Математически точное выполнение требований из schemas-basic.ts:
 * ✅ length >= VALIDATION_LIMITS.PASSWORD_MIN_LENGTH (8)
 * ✅ /[A-Z]/.test(val) === true (ВСЕГДА содержит заглавную)
 * ✅ /[a-z]/.test(val) === true (ВСЕГДА содержит строчную)
 * ✅ /[0-9]/.test(val) === true (ВСЕГДА содержит цифру)
 * ✅ /[^A-Za-z0-9]/.test(val) === true (ВСЕГДА содержит спецсимвол)
 *
 * РЕЗУЛЬТАТ: passwordSchema.safeParse() ВСЕГДА вернет success: true
 */
export function generatePasswordForAutoFlow(
  length: number = VALIDATION_LIMITS.PASSWORD_MIN_LENGTH + DEFAULT_EXTRA_LENGTH
): string {
  const safeLength = Math.max(length, VALIDATION_LIMITS.PASSWORD_MIN_LENGTH);
  const mandatoryChars = createMandatoryChars();
  const additionalChars = createAdditionalChars(safeLength - mandatoryChars.length);
  const allChars = [...mandatoryChars, ...additionalChars];
  
  return shuffleArray(allChars).join('');
}

function createMandatoryChars(): string[] {
  // МАТЕМАТИЧЕСКАЯ ГАРАНТИЯ: по одному символу каждого типа для passwordSchema
  return [
    getRandomChar(CHARSET_LOWER),
    getRandomChar(CHARSET_UPPER),
    getRandomChar(CHARSET_DIGITS),
    getRandomChar(CHARSET_SYMBOLS),
  ];
}

function createAdditionalChars(count: number): string[] {
  return Array.from({ length: count }, () => getRandomChar(CHARSET_ALL));
}

function getRandomChar(charset: string): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const randomValue = array[0];
  if (randomValue === undefined) {
    throw new Error('Failed to generate random value');
  }
  const char = charset[randomValue % charset.length];
  if (char === undefined) {
    throw new Error('Invalid charset access');
  }
  return char;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomIndex(i + 1);
    swapElements(result, i, j);
  }
  return result;
}

function getRandomIndex(max: number): number {
  const randomArray = new Uint32Array(1);
  crypto.getRandomValues(randomArray);
  const randomValue = randomArray[0];
  if (randomValue === undefined) {
    throw new Error('Failed to generate random value');
  }
  return randomValue % max;
}

function swapElements<T>(array: T[], i: number, j: number): void {
  const temp = array.at(i);
  const elementJ = array.at(j);
  if (temp !== undefined && elementJ !== undefined) {
    // eslint-disable-next-line security/detect-object-injection
    array[i] = elementJ;
    // eslint-disable-next-line security/detect-object-injection
    array[j] = temp;
  }
}