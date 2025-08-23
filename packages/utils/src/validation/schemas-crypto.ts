/**
 * Схемы валидации для криптовалют
 * Извлечено из validation-schemas.ts для улучшения поддерживаемости
 */

import { CRYPTOCURRENCIES, VALIDATION_PATTERNS, DECIMAL_PRECISION } from '@repo/constants';
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
  .refine(
    val => {
      // Allow empty string
      if (val === '') return true;
      // Simple numeric validation without unsafe regex
      const num = Number(val);
      if (Number.isNaN(num)) return false;
      // Check decimal places
      const decimalParts = val.split('.');
      if (decimalParts.length > 2) return false;
      if (
        decimalParts.length === 2 &&
        decimalParts[1] &&
        decimalParts[1].length > DECIMAL_PRECISION.CRYPTO_DECIMAL_PLACES
      )
        return false;
      return true;
    },
    { message: 'AMOUNT_FORMAT' }
  )
  .refine(val => val === '' || Number(val) > 0, { message: 'AMOUNT_POSITIVE' });

/**
 * Валидация криптовалюты
 */
export const currencySchema = z.enum(CRYPTOCURRENCIES as unknown as [string, ...string[]]);
