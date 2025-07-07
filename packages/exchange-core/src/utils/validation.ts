import {
  VALIDATION_MESSAGES,
  CRYPTOCURRENCIES,
  EXCHANGE_VALIDATION_PATTERNS,
  EXCHANGE_VALIDATION_MESSAGES,
  VALIDATION_BOUNDS,
} from '@repo/constants';

import {
  generateSessionId as serviceGenerateSessionId,
  generateOrderId as serviceGenerateOrderId,
} from '../services';

import type {
  CryptoCurrency,
  CreateOrderRequest,
  CreateUserRequest,
  RecipientData,
} from '../types';

import {
  validateEmail as validateBasicEmail,
  validatePassword as validateBasicPassword,
} from './basic-validators';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Валидация email
 * @deprecated Use validateBasicEmail from basic-validators instead
 */
export function validateEmail(email: string): ValidationResult {
  return validateBasicEmail(email);
}

/**
 * Валидация пароля
 * @deprecated Use validateBasicPassword from basic-validators instead
 */
export function validatePassword(password: string): ValidationResult {
  return validateBasicPassword(password);
}

/**
 * Валидация криптовалюты
 * @deprecated Use basic-validators instead
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
 * @deprecated Use basic-validators instead
 */
export function validateCryptoAmount(amount: number, _currency: CryptoCurrency): ValidationResult {
  const errors: string[] = [];

  if (!amount || amount <= VALIDATION_BOUNDS.MIN_VALUE) {
    errors.push(VALIDATION_MESSAGES.AMOUNT_INVALID);
  }

  return {
    isValid: errors.length === VALIDATION_BOUNDS.MIN_VALUE,
    errors,
  };
}

/**
 * Валидация базовых данных заявки (email, currency)
 */
function validateOrderBasicData(
  email: string,
  currency: string
): { errors: string[]; currencyIsValid: boolean } {
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
function validateRecipientData(recipientData?: RecipientData): ValidationResult {
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
 * @deprecated Use basic-validators instead
 */
export function validateCreateUser(request: CreateUserRequest): ValidationResult {
  const errors: string[] = [];

  const emailValidation = validateEmail(request.email);
  errors.push(...emailValidation.errors);

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
 * @deprecated Use sanitizeEmail from data-sanitizers instead
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Генерация безопасного session ID
 * @deprecated Use generateSessionId from services instead
 */
export function generateSessionId(): string {
  return serviceGenerateSessionId();
}

/**
 * Генерация ID заявки
 * @deprecated Use generateOrderId from services instead
 */
export function generateOrderId(): string {
  return serviceGenerateOrderId();
}
