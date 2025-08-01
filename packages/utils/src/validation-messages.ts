/**
 * Validation message helpers for internationalization
 * Provides centralized validation error messages with i18n support
 */

import { VALIDATION_LIMITS } from '@repo/constants';

export interface ValidationMessageContext {
  min?: number;
  max?: number;
  field?: string;
}

/**
 * Default validation messages in Russian (fallback)
 * These will be used when i18n is not available or as fallback
 */
export const DEFAULT_VALIDATION_MESSAGES = {
  email: {
    invalid: 'Некорректный email адрес',
    required: 'Email обязателен',
  },
  password: {
    minLength: `Пароль должен содержать минимум ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} символов`,
    required: 'Пароль обязателен',
  },
  confirmPassword: {
    noMatch: 'Пароли не совпадают',
    required: 'Подтверждение пароля обязательно',
  },
  username: {
    minLength: `Имя пользователя должно содержать минимум ${VALIDATION_LIMITS.USERNAME_MIN_LENGTH} символов`,
    maxLength: `Имя пользователя не должно превышать ${VALIDATION_LIMITS.USERNAME_MAX_LENGTH} символов`,
    required: 'Имя пользователя обязательно',
  },
  firstName: {
    minLength: `Имя должно содержать минимум ${VALIDATION_LIMITS.FIRST_NAME_MIN_LENGTH} символов`,
    maxLength: `Имя не должно превышать ${VALIDATION_LIMITS.FIRST_NAME_MAX_LENGTH} символов`,
    required: 'Имя обязательно',
  },
  lastName: {
    minLength: `Фамилия должна содержать минимум ${VALIDATION_LIMITS.LAST_NAME_MIN_LENGTH} символов`,
    maxLength: `Фамилия не должна превышать ${VALIDATION_LIMITS.LAST_NAME_MAX_LENGTH} символов`,
    required: 'Фамилия обязательна',
  },
  phone: {
    invalid: 'Некорректный номер телефона',
    required: 'Номер телефона обязателен',
  },
  amount: {
    minValue: 'Минимальная сумма: {{min}}',
    maxValue: 'Максимальная сумма: {{max}}',
    required: 'Сумма обязательна',
  },
  required: 'Это поле обязательно',
  invalid: 'Некорректное значение',
} as const;

/**
 * Type for validation message function that can be used with or without i18n
 */
export type ValidationMessageFn = (key: string, context?: ValidationMessageContext) => string;

/**
 * Creates validation messages with substitution for min/max values
 */
export function createValidationMessage(
  template: string,
  context?: ValidationMessageContext
): string {
  let message = template;

  if (context?.min !== undefined) {
    message = message.replace('{{min}}', context.min.toString());
  }

  if (context?.max !== undefined) {
    message = message.replace('{{max}}', context.max.toString());
  }

  return message;
}

/**
 * Message path mappings for safe access
 */
const MESSAGE_PATH_MAP: Record<string, string> = {
  'email.invalid': DEFAULT_VALIDATION_MESSAGES.email.invalid,
  'email.required': DEFAULT_VALIDATION_MESSAGES.email.required,
  'password.minLength': DEFAULT_VALIDATION_MESSAGES.password.minLength,
  'password.required': DEFAULT_VALIDATION_MESSAGES.password.required,
  'confirmPassword.noMatch': DEFAULT_VALIDATION_MESSAGES.confirmPassword.noMatch,
  'confirmPassword.required': DEFAULT_VALIDATION_MESSAGES.confirmPassword.required,
  'username.minLength': DEFAULT_VALIDATION_MESSAGES.username.minLength,
  'username.maxLength': DEFAULT_VALIDATION_MESSAGES.username.maxLength,
  'username.required': DEFAULT_VALIDATION_MESSAGES.username.required,
  'firstName.minLength': DEFAULT_VALIDATION_MESSAGES.firstName.minLength,
  'firstName.maxLength': DEFAULT_VALIDATION_MESSAGES.firstName.maxLength,
  'firstName.required': DEFAULT_VALIDATION_MESSAGES.firstName.required,
  'lastName.minLength': DEFAULT_VALIDATION_MESSAGES.lastName.minLength,
  'lastName.maxLength': DEFAULT_VALIDATION_MESSAGES.lastName.maxLength,
  'lastName.required': DEFAULT_VALIDATION_MESSAGES.lastName.required,
  'phone.invalid': DEFAULT_VALIDATION_MESSAGES.phone.invalid,
  'phone.required': DEFAULT_VALIDATION_MESSAGES.phone.required,
  required: DEFAULT_VALIDATION_MESSAGES.required,
  invalid: DEFAULT_VALIDATION_MESSAGES.invalid,
};

/**
 * Safe validation message getter with type checking
 */
export function getValidationMessage(path: string, context?: ValidationMessageContext): string {
  const template = Object.prototype.hasOwnProperty.call(MESSAGE_PATH_MAP, path)
    ? (MESSAGE_PATH_MAP[path as keyof typeof MESSAGE_PATH_MAP] ??
      DEFAULT_VALIDATION_MESSAGES.invalid)
    : DEFAULT_VALIDATION_MESSAGES.invalid;
  return createValidationMessage(template, context);
}

/**
 * Validation message helpers for specific fields
 */
export const validationMessages = {
  email: {
    invalid: () => getValidationMessage('email.invalid'),
    required: () => getValidationMessage('email.required'),
  },
  password: {
    minLength: () =>
      getValidationMessage('password.minLength', {
        min: VALIDATION_LIMITS.PASSWORD_MIN_LENGTH,
      }),
    required: () => getValidationMessage('password.required'),
  },
  confirmPassword: {
    noMatch: () => getValidationMessage('confirmPassword.noMatch'),
    required: () => getValidationMessage('confirmPassword.required'),
  },
  username: {
    minLength: () =>
      getValidationMessage('username.minLength', {
        min: VALIDATION_LIMITS.USERNAME_MIN_LENGTH,
      }),
    maxLength: () =>
      getValidationMessage('username.maxLength', {
        max: VALIDATION_LIMITS.USERNAME_MAX_LENGTH,
      }),
    required: () => getValidationMessage('username.required'),
  },
  firstName: {
    minLength: () =>
      getValidationMessage('firstName.minLength', {
        min: VALIDATION_LIMITS.FIRST_NAME_MIN_LENGTH,
      }),
    maxLength: () =>
      getValidationMessage('firstName.maxLength', {
        max: VALIDATION_LIMITS.FIRST_NAME_MAX_LENGTH,
      }),
    required: () => getValidationMessage('firstName.required'),
  },
  lastName: {
    minLength: () =>
      getValidationMessage('lastName.minLength', {
        min: VALIDATION_LIMITS.LAST_NAME_MIN_LENGTH,
      }),
    maxLength: () =>
      getValidationMessage('lastName.maxLength', {
        max: VALIDATION_LIMITS.LAST_NAME_MAX_LENGTH,
      }),
    required: () => getValidationMessage('lastName.required'),
  },
  phone: {
    invalid: () => getValidationMessage('phone.invalid'),
    required: () => getValidationMessage('phone.required'),
  },
  required: () => getValidationMessage('required'),
  invalid: () => getValidationMessage('invalid'),
} as const;
