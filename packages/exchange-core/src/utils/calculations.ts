import {
  COMMISSION_RATES,
  AMOUNT_LIMITS,
  MOCK_EXCHANGE_RATES,
  PERCENTAGE_CALCULATIONS,
  DECIMAL_PRECISION,
  getCurrencyDecimals,
  type CryptoCurrency,
} from '@repo/constants';
import {
  calculateNetAmount,
  calculateGrossAmountFromNet,
  calculateCommissionAmount,
  formatUahAmount,
  parseFormattedAmount,
  formatCryptoAmountForUI,
} from '@repo/utils';

import { SmartPricingService } from '../services/smart-pricing-service';
import type { ExchangeRate, HybridExchangeRate } from '../types';

/**
 * Получить текущий курс криптовалюты
 * @param currency - Тип криптовалюты
 * @returns Объект с курсом валюты, комиссией и временной меткой
 * @example
 * const rate = getExchangeRate('BTC');
 * console.log(rate.uahRate); // 1755000 (мок курс)
 */
export function getExchangeRate(currency: CryptoCurrency): ExchangeRate {
  const mockRate = MOCK_EXCHANGE_RATES[currency];

  // ⚡ Defense against undefined currency rates (graceful fallback to USDT)
  if (!mockRate) {
    const fallbackRate = MOCK_EXCHANGE_RATES.USDT;
    return {
      currency: 'USDT', // Fallback to USDT for safety
      usdRate: fallbackRate.usdRate,
      uahRate: fallbackRate.uahRate,
      commission: COMMISSION_RATES.USDT,
      lastUpdated: new Date(),
    };
  }

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
 * @param cryptoAmount - Количество криптовалюты
 * @param currency - Тип криптовалюты
 * @returns Сумма в гривнах после вычета комиссии
 * @example
 * const uahAmount = calculateUahAmount(0.001, 'BTC');
 * console.log(uahAmount); // 1702.45 (с учетом комиссии 3%)
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
 * @param uahAmount - Сумма в гривнах
 * @param currency - Тип криптовалюты
 * @returns Количество криптовалюты с учетом комиссии
 * @example
 * const btcAmount = calculateCryptoAmount(1000, 'BTC');
 * console.log(btcAmount); // 0.000569 (с учетом комиссии)
 */
export function calculateCryptoAmount(uahAmount: number, currency: CryptoCurrency): number {
  const rate = getExchangeRate(currency);
  const grossAmount = calculateGrossAmountFromNet(uahAmount, rate.commission);
  const cryptoAmount = grossAmount / rate.uahRate;
  const decimals = getCurrencyDecimals(currency);
  const formattedAmount = formatCryptoAmountForUI(
    cryptoAmount,
    Math.min(decimals, DECIMAL_PRECISION.UI_MAX_DECIMAL_PLACES)
  );
  return parseFormattedAmount(formattedAmount);
}

/**
 * Рассчитать комиссию в UAH
 * @param cryptoAmount - Количество криптовалюты
 * @param currency - Тип криптовалюты
 * @returns Размер комиссии в гривнах
 * @example
 * const commission = calculateCommission(0.001, 'BTC');
 * console.log(commission); // 52.65 (3% от 1755 UAH)
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
  const limits = getCurrencyLimits(currency);

  if (cryptoAmount < limits.minCrypto) {
    return {
      isValid: false,
      reason: 'Amount too low',
      localizationKey: 'server.errors.business.amountTooLow',
      params: { min: limits.minCrypto.toString() },
    };
  }

  if (cryptoAmount > limits.maxCrypto) {
    return {
      isValid: false,
      reason: 'Amount too high',
      localizationKey: 'server.errors.business.amountTooHigh',
      params: { max: limits.maxCrypto.toString() },
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

/**
 * Получить минимальную сумму криптовалюты для отображения в UI
 * @param currency - Тип криптовалюты
 * @returns Минимальная сумма для отправки
 * @example
 * const minAmount = getMinCryptoAmountForUI('BTC');
 * console.log(minAmount); // 0.00025 (для $10 при курсе $40000)
 */
export function getMinCryptoAmountForUI(currency: CryptoCurrency): number {
  const limits = getCurrencyLimits(currency);
  return limits.minCrypto;
}

// ========================================
// НОВЫЕ АСИНХРОННЫЕ ФУНКЦИИ ДЛЯ ГИБРИДНОЙ СИСТЕМЫ ЦЕНООБРАЗОВАНИЯ
// ========================================

// Singleton instance для переиспользования
let pricingServiceInstance: SmartPricingService | null = null;

function getPricingService(): SmartPricingService {
  if (!pricingServiceInstance) {
    pricingServiceInstance = new SmartPricingService();
  }
  return pricingServiceInstance;
}

/**
 * НОВАЯ АСИНХРОННАЯ ВЕРСИЯ getExchangeRate
 * Использует гибридную систему ценообразования с real-time курсами для USDT
 * 
 * @param currency - Тип криптовалюты
 * @returns Расширенный объект с курсом валюты, включая источник данных
 * @example
 * const rate = await getExchangeRateAsync('USDT');
 * console.log(rate.source); // 'api' | 'fallback' | 'mock'
 * console.log(rate.uahRate); // 41.20 (real-time курс)
 */
export async function getExchangeRateAsync(currency: CryptoCurrency): Promise<HybridExchangeRate> {
  const pricingService = getPricingService();
  return await pricingService.getSafeExchangeRate(currency);
}

/**
 * НОВАЯ АСИНХРОННАЯ ВЕРСИЯ calculateUahAmount
 * Использует real-time курсы для более точных расчетов
 * 
 * @param cryptoAmount - Количество криптовалюты
 * @param currency - Тип криптовалюты
 * @returns Сумма в гривнах после вычета комиссии
 * @example
 * const uahAmount = await calculateUahAmountAsync(1000, 'USDT');
 * console.log(uahAmount); // 40620.00 (с real-time курсом и комиссией)
 */
export async function calculateUahAmountAsync(
  cryptoAmount: number,
  currency: CryptoCurrency
): Promise<number> {
  const rate = await getExchangeRateAsync(currency);
  const grossAmount = cryptoAmount * rate.uahRate;
  const netAmount = calculateNetAmount(grossAmount, rate.commission);
  return parseFormattedAmount(formatUahAmount(netAmount));
}

/**
 * НОВАЯ АСИНХРОННАЯ ВЕРСИЯ calculateCryptoAmount
 * Использует real-time курсы для более точных расчетов
 * 
 * @param uahAmount - Сумма в гривнах
 * @param currency - Тип криптовалюты
 * @returns Количество криптовалюты с учетом комиссии
 * @example
 * const usdtAmount = await calculateCryptoAmountAsync(40000, 'USDT');
 * console.log(usdtAmount); // 985.23 (с real-time курсом и комиссией)
 */
export async function calculateCryptoAmountAsync(
  uahAmount: number,
  currency: CryptoCurrency
): Promise<number> {
  const rate = await getExchangeRateAsync(currency);
  const grossAmount = calculateGrossAmountFromNet(uahAmount, rate.commission);
  const cryptoAmount = grossAmount / rate.uahRate;
  const decimals = getCurrencyDecimals(currency);
  const formattedAmount = formatCryptoAmountForUI(
    cryptoAmount,
    Math.min(decimals, DECIMAL_PRECISION.UI_MAX_DECIMAL_PLACES)
  );
  return parseFormattedAmount(formattedAmount);
}
