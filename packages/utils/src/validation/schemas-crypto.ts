/**
 * Схемы валидации для криптовалют
 * Извлечено из validation-schemas.ts для улучшения поддерживаемости
 */

import { CRYPTOCURRENCIES, VALIDATION_BOUNDS, VALIDATION_PATTERNS } from '@repo/constants';
import type { CryptoCurrency } from '@repo/constants';
import { z } from 'zod';

// === CRYPTO ВАЛИДАЦИЯ ===

/**
 * Bitcoin адрес валидация
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Используется только для программной валидации в exchange-core
 * Не используется в формах пользователя, поэтому без хардкод сообщений
 */
export const btcAddressSchema = z.string().min(1).regex(VALIDATION_PATTERNS.BTC_ADDRESS);

/**
 * Ethereum адрес валидация
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Используется только для программной валидации в exchange-core
 * Не используется в формах пользователя, поэтому без хардкод сообщений
 */
export const ethAddressSchema = z.string().min(1).regex(VALIDATION_PATTERNS.ETH_ADDRESS);

/**
 * Litecoin адрес валидация
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Используется только для программной валидации в exchange-core
 * Не используется в формах пользователя, поэтому без хардкод сообщений
 */
export const ltcAddressSchema = z.string().min(1).regex(VALIDATION_PATTERNS.LTC_ADDRESS);

/**
 * Динамическая функция для создания схемы криптоадреса
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Используется только в exchange-core для validateCryptoAddress()
 * Программная валидация без пользовательских сообщений
 */
export const createCryptoAddressSchema = (currency: CryptoCurrency) => {
  switch (currency) {
    case 'BTC':
      return btcAddressSchema;
    case 'ETH':
    case 'USDT':
      return ethAddressSchema;
    case 'LTC':
      return ltcAddressSchema;
    default:
      return z.string().min(1);
  }
};

/**
 * Криптовалютная сумма в строковом формате
 */
export const cryptoAmountStringSchema = z
  .string()
  .regex(/^\d+\.?\d{0,8}$/)
  .refine(val => Number(val) > 0)
  .refine(val => Number(val) >= VALIDATION_BOUNDS.MIN_ORDER_AMOUNT)
  .refine(val => Number(val) <= VALIDATION_BOUNDS.MAX_ORDER_AMOUNT);

/**
 * Валидация криптовалюты
 */
export const currencySchema = z.enum(CRYPTOCURRENCIES as unknown as [string, ...string[]]);
