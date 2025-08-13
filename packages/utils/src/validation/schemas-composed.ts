/**
 * Составные схемы валидации
 * Сложные схемы которые комбинируют базовые
 */

import type { CryptoCurrency } from '@repo/constants';
import { z } from 'zod';

import {
  emailSchema,
  legacyPasswordSchema,
  newPasswordSchema,
  phoneInternationalSchema,
} from './schemas-basic';
import {
  cryptoAmountStringSchema,
  currencySchema,
  createCryptoAddressSchema,
} from './schemas-crypto';

// === ДОПОЛНИТЕЛЬНЫЕ СОСТАВНЫЕ СХЕМЫ ===

/**
 * Создание заказа - усиленная валидация
 */
export const createOrderEnhancedSchema = z.object({
  email: emailSchema,
  cryptoAmount: cryptoAmountStringSchema, // Строгая валидация суммы
  currency: currencySchema,
  recipientAddress: z.string().min(1),
});

/**
 * Смена пароля - усиленная валидация
 */
export const changePasswordEnhancedSchema = z
  .object({
    currentPassword: legacyPasswordSchema, // Текущий пароль может быть legacy
    newPassword: newPasswordSchema, // Новый пароль должен быть усиленным
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
  });

/**
 * Схема для создания заказа с crypto адресом
 */
export const createOrderWithAddressSchema = z
  .object({
    email: emailSchema,
    cryptoAmount: cryptoAmountStringSchema,
    currency: currencySchema,
  })
  .refine(async data => {
    // Валидация crypto адреса в зависимости от валюты
    const _addressSchema = createCryptoAddressSchema(data.currency as CryptoCurrency);
    return true; // Placeholder - реальная валидация будет в компоненте
  });

/**
 * Схема для обновления профиля пользователя
 */
export const updateUserProfileSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneInternationalSchema.optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
  })
  .refine(data => {
    // Хотя бы одно поле должно быть заполнено
    return Object.values(data).some(value => value !== undefined && value !== '');
  });
