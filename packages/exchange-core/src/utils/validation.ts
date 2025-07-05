import {
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES,
  CRYPTOCURRENCIES,
  EXCHANGE_VALIDATION_PATTERNS,
  EXCHANGE_VALIDATION_MESSAGES,
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
    isValid: errors.length === 0,
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
    isValid: errors.length === 0,
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
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация суммы криптовалюты
 */
export function validateCryptoAmount(amount: number, currency: CryptoCurrency): ValidationResult {
  const errors: string[] = [];

  if (!amount || amount <= 0) {
    errors.push(VALIDATION_MESSAGES.AMOUNT_INVALID);
  } else {
    const limitCheck = isAmountWithinLimits(amount, currency);
    if (!limitCheck.isValid && limitCheck.reason) {
      errors.push(limitCheck.reason);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация создания заявки
 */
export function validateCreateOrder(request: CreateOrderRequest): ValidationResult {
  const errors: string[] = [];

  // Валидация email
  const emailValidation = validateEmail(request.email);
  errors.push(...emailValidation.errors);

  // Валидация криптовалюты
  const currencyValidation = validateCurrency(request.currency);
  errors.push(...currencyValidation.errors);

  // Валидация суммы
  if (currencyValidation.isValid) {
    const amountValidation = validateCryptoAmount(request.cryptoAmount, request.currency);
    errors.push(...amountValidation.errors);
  }

  // Валидация номера карты (если указан)
  if (
    request.recipientData?.cardNumber &&
    !EXCHANGE_VALIDATION_PATTERNS.CARD_NUMBER.test(request.recipientData.cardNumber)
  ) {
    errors.push(EXCHANGE_VALIDATION_MESSAGES.CARD_NUMBER_INVALID);
  }

  return {
    isValid: errors.length === 0,
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
    isValid: errors.length === 0,
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
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
