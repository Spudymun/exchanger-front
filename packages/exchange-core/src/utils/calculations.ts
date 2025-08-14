import {
  COMMISSION_RATES,
  AMOUNT_LIMITS,
  MOCK_EXCHANGE_RATES,
  PERCENTAGE_CALCULATIONS,
  type CryptoCurrency,
} from '@repo/constants';
import {
  calculateNetAmount,
  calculateGrossAmountFromNet,
  calculateCommissionAmount,
  formatUahAmount,
  parseFormattedAmount,
} from '@repo/utils';

import type { ExchangeRate } from '../types';

import { formatCryptoAmount } from './crypto';

/**
 * Получить текущий курс криптовалюты
 */
export function getExchangeRate(currency: CryptoCurrency): ExchangeRate {
  const mockRate = MOCK_EXCHANGE_RATES[currency];
  return {
    currency,
    usdRate: mockRate.usdRate,
    uahRate: mockRate.uahRate,
    commission: COMMISSION_RATES[currency],
    lastUpdated: new Date(),
  };
}

/**
 * Рассчитать сумму в UAH с учетом комиссии
 * Uses centralized calculation utilities to eliminate code duplication
 */
export function calculateUahAmount(cryptoAmount: number, currency: CryptoCurrency): number {
  const rate = getExchangeRate(currency);
  const grossAmount = cryptoAmount * rate.uahRate;
  const netAmount = calculateNetAmount(grossAmount, rate.commission);
  return parseFormattedAmount(formatUahAmount(netAmount));
}

/**
 * Рассчитать сумму криптовалюты из UAH
 * Uses centralized calculation utilities to eliminate code duplication
 */
export function calculateCryptoAmount(uahAmount: number, currency: CryptoCurrency): number {
  const rate = getExchangeRate(currency);
  const grossAmount = calculateGrossAmountFromNet(uahAmount, rate.commission);
  const cryptoAmount = grossAmount / rate.uahRate;
  return parseFormattedAmount(formatCryptoAmount(cryptoAmount, currency));
}

/**
 * Рассчитать комиссию в UAH
 */
export function calculateCommission(cryptoAmount: number, currency: CryptoCurrency): number {
  const rate = getExchangeRate(currency);
  const grossAmount = cryptoAmount * rate.uahRate;
  const commission = calculateCommissionAmount(grossAmount, rate.commission);
  return Number(commission.toFixed(PERCENTAGE_CALCULATIONS.UAH_ROUNDING_PRECISION));
}

/**
 * Проверить, попадает ли сумма в допустимые лимиты
 * ОБНОВЛЕНО: Интеграция с next-intl - возвращает ключи локализации
 */
export function isAmountWithinLimits(
  cryptoAmount: number,
  currency: CryptoCurrency
): {
  isValid: boolean;
  reason?: string;
  localizationKey?: string;
  params?: Record<string, string | number>;
} {
  const usdAmount = cryptoAmount * getExchangeRate(currency).usdRate;

  if (usdAmount < AMOUNT_LIMITS.MIN_USD) {
    return {
      isValid: false,
      reason: `Min amount: $${AMOUNT_LIMITS.MIN_USD}`, // English fallback for backward compatibility
      localizationKey: 'validation.crypto.minAmount',
      params: { min: `$${AMOUNT_LIMITS.MIN_USD}` },
    };
  }

  if (usdAmount > AMOUNT_LIMITS.MAX_USD) {
    return {
      isValid: false,
      reason: `Max amount: $${AMOUNT_LIMITS.MAX_USD}`, // English fallback for backward compatibility
      localizationKey: 'validation.crypto.maxAmount',
      params: { max: `$${AMOUNT_LIMITS.MAX_USD}` },
    };
  }

  return { isValid: true };
}

/**
 * Получить информацию о лимитах для криптовалюты
 */
export function getCurrencyLimits(currency: CryptoCurrency) {
  const rate = getExchangeRate(currency);
  return {
    minCrypto: AMOUNT_LIMITS.MIN_USD / rate.usdRate,
    maxCrypto: AMOUNT_LIMITS.MAX_USD / rate.usdRate,
    minUSD: AMOUNT_LIMITS.MIN_USD,
    maxUSD: AMOUNT_LIMITS.MAX_USD,
  };
}
