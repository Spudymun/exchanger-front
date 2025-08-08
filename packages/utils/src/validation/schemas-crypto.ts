/**
 * Схемы валидации для криптовалют
 * Извлечено из validation-schemas.ts для улучшения поддерживаемости
 */

import { CRYPTOCURRENCIES, VALIDATION_BOUNDS } from '@repo/constants';
import type { CryptoCurrency } from '@repo/exchange-core';
import { z } from 'zod';

import { PATTERNS } from './schemas-basic';

// === CRYPTO ВАЛИДАЦИЯ ===

/**
 * Bitcoin адрес валидация
 */
export const btcAddressSchema = z
  .string()
  .min(1, { message: 'Bitcoin address is required' })
  .regex(PATTERNS.BTC_ADDRESS, { message: 'Invalid Bitcoin address format' });

/**
 * Ethereum адрес валидация
 */
export const ethAddressSchema = z
  .string()
  .min(1, { message: 'Ethereum address is required' })
  .regex(PATTERNS.ETH_ADDRESS, { message: 'Invalid Ethereum address format' });

/**
 * Litecoin адрес валидация
 */
export const ltcAddressSchema = z
  .string()
  .min(1, { message: 'Litecoin address is required' })
  .regex(PATTERNS.LTC_ADDRESS, { message: 'Invalid Litecoin address format' });

/**
 * Динамическая функция для создания схемы криптоадреса
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
      return z.string().min(1, { message: 'Crypto address is required' });
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
