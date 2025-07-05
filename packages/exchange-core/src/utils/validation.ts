import {
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES,
  CRYPTOCURRENCIES,
  EXCHANGE_VALIDATION_PATTERNS,
  EXCHANGE_VALIDATION_MESSAGES,
  VALIDATION_BOUNDS,
  DECIMAL_PRECISION,
  UI_NUMERIC_CONSTANTS,
} from '@repo/constants';

import type { CryptoCurrency, CreateOrderRequest, CreateUserRequest } from '../types';

import { isAmountWithinLimits } from './calculations';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Валидация email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push(VALIDATION_MESSAGES.EMAIL_REQUIRED);
  } else if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    errors.push(VALIDATION_MESSAGES.EMAIL_INVALID);
  }

  return {
    isValid: errors.length === VALIDATION_BOUNDS.MIN_VALUE,
    errors,
  };
}

/**
 * Валидация пароля
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push(VALIDATION_MESSAGES.PASSWORD_REQUIRED);
  } else if (!VALIDATION_PATTERNS.PASSWORD.test(password)) {
    errors.push(VALIDATION_MESSAGES.PASSWORD_WEAK);
  }

  return {
    isValid: errors.length === VALIDATION_BOUNDS.MIN_VALUE,
    errors,
  };
}

/**
 * Валидация криптовалюты
 */
export function validateCurrency(currency: string): ValidationResult {
  const errors: string[] = [];

  if (!CRYPTOCURRENCIES.includes(currency as CryptoCurrency)) {
    errors.push(EXCHANGE_VALIDATION_MESSAGES.CURRENCY_INVALID);
  }

  return {
    isValid: errors.length === VALIDATION_BOUNDS.MIN_VALUE,
    errors,
  };
}

/**
 * Валидация суммы криптовалюты
 */
export function validateCryptoAmount(amount: number, currency: CryptoCurrency): ValidationResult {
  const errors: string[] = [];

  if (!amount || amount <= VALIDATION_BOUNDS.MIN_VALUE) {
    errors.push(VALIDATION_MESSAGES.AMOUNT_INVALID);
  } else {
    const limitCheck = isAmountWithinLimits(amount, currency);
    if (!limitCheck.isValid && limitCheck.reason) {
      errors.push(limitCheck.reason);
    }
  }

  return {
    isValid: errors.length === VALIDATION_BOUNDS.MIN_VALUE,
    errors,
  };
}

/**
 * Валидация базовых данных заявки (email, currency)
 */
function validateOrderBasicData(email: string, currency: string): { errors: string[]; currencyIsValid: boolean } {
  const errors: string[] = [];

  const emailValidation = validateEmail(email);
  errors.push(...emailValidation.errors);

  const currencyValidation = validateCurrency(currency);
  errors.push(...currencyValidation.errors);

  return {
    errors,
    currencyIsValid: currencyValidation.isValid,
  };
}

/**
 * Валидация данных получателя
 */
function validateRecipientData(recipientData?: { cardNumber?: string }): ValidationResult {
  const errors: string[] = [];

  if (
    recipientData?.cardNumber &&
    !EXCHANGE_VALIDATION_PATTERNS.CARD_NUMBER.test(recipientData.cardNumber)
  ) {
    errors.push(EXCHANGE_VALIDATION_MESSAGES.CARD_NUMBER_INVALID);
  }

  return {
    isValid: errors.length === VALIDATION_BOUNDS.MIN_VALUE,
    errors,
  };
}

/**
 * Валидация создания заявки
 */
export function validateCreateOrder(request: CreateOrderRequest): ValidationResult {
  const errors: string[] = [];

  // Валидация базовых данных
  const basicValidation = validateOrderBasicData(request.email, request.currency);
  errors.push(...basicValidation.errors);

  // Валидация суммы (только если валюта валидна)
  if (basicValidation.currencyIsValid) {
    const amountValidation = validateCryptoAmount(request.cryptoAmount, request.currency);
    errors.push(...amountValidation.errors);
  }

  // Валидация данных получателя
  const recipientValidation = validateRecipientData(request.recipientData);
  errors.push(...recipientValidation.errors);

  return {
    isValid: errors.length === VALIDATION_BOUNDS.MIN_VALUE,
    errors,
  };
}

/**
 * Валидация создания пользователя
 */
export function validateCreateUser(request: CreateUserRequest): ValidationResult {
  const errors: string[] = [];

  // Валидация email
  const emailValidation = validateEmail(request.email);
  errors.push(...emailValidation.errors);

  // Валидация пароля (если указан)
  if (request.password) {
    const passwordValidation = validatePassword(request.password);
    errors.push(...passwordValidation.errors);
  }

  return {
    isValid: errors.length === VALIDATION_BOUNDS.MIN_VALUE,
    errors,
  };
}

/**
 * Санитизация email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Генерация безопасного session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Генерация ID заявки
 */
export function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(UI_NUMERIC_CONSTANTS.ID_GENERATION_BASE).substr(UI_NUMERIC_CONSTANTS.SUBSTR_START_INDEX, DECIMAL_PRECISION.ORDER_ID_RANDOM_LENGTH)}`;
}
