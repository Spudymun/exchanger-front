import { COMMISSION_RATES, AMOUNT_LIMITS, MOCK_EXCHANGE_RATES, PERCENTAGE_CALCULATIONS, VALIDATION_BOUNDS, DECIMAL_PRECISION } from '@repo/constants';

import type { CryptoCurrency, ExchangeRate } from '../types';

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
 */
export function calculateUahAmount(cryptoAmount: number, currency: CryptoCurrency): number {
  const rate = getExchangeRate(currency);
  const grossAmount = cryptoAmount * rate.uahRate;
  const commission = grossAmount * (rate.commission / PERCENTAGE_CALCULATIONS.PERCENT_BASE);
  return Number((grossAmount - commission).toFixed(PERCENTAGE_CALCULATIONS.UAH_ROUNDING_PRECISION));
}

/**
 * Рассчитать сумму криптовалюты из UAH
 */
export function calculateCryptoAmount(uahAmount: number, currency: CryptoCurrency): number {
  const rate = getExchangeRate(currency);
  const grossAmount = uahAmount / (VALIDATION_BOUNDS.SINGLE_ELEMENT - rate.commission / PERCENTAGE_CALCULATIONS.PERCENT_BASE);
  const cryptoAmount = grossAmount / rate.uahRate;

  // Округление до 8 знаков для криптовалют
  return Number(cryptoAmount.toFixed(DECIMAL_PRECISION.CRYPTO_DECIMAL_PLACES));
}

/**
 * Рассчитать комиссию в UAH
 */
export function calculateCommission(cryptoAmount: number, currency: CryptoCurrency): number {
  const rate = getExchangeRate(currency);
  const grossAmount = cryptoAmount * rate.uahRate;
  const commission = grossAmount * (rate.commission / PERCENTAGE_CALCULATIONS.PERCENT_BASE);
  return Number(commission.toFixed(PERCENTAGE_CALCULATIONS.UAH_ROUNDING_PRECISION));
}

/**
 * Проверить, что сумма в пределах лимитов
 */
export function isAmountWithinLimits(
  cryptoAmount: number,
  currency: CryptoCurrency
): { isValid: boolean; reason?: string } {
  const usdAmount = cryptoAmount * getExchangeRate(currency).usdRate;

  if (usdAmount < AMOUNT_LIMITS.MIN_USD) {
    return {
      isValid: false,
      reason: `Минимальная сумма: $${AMOUNT_LIMITS.MIN_USD}`,
    };
  }

  if (usdAmount > AMOUNT_LIMITS.MAX_USD) {
    return {
      isValid: false,
      reason: `Максимальная сумма: $${AMOUNT_LIMITS.MAX_USD}`,
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
