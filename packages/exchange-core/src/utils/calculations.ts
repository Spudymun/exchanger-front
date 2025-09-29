import {
  AMOUNT_LIMITS,
  PERCENTAGE_CALCULATIONS,
  DECIMAL_PRECISION,
  getCurrencyDecimals,
  CRYPTO_BUSINESS_LIMITS,
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
import type { HybridExchangeRate } from '../types';

// ========================================
// LEGACY SYNC FUNCTIONS REMOVED
// Use async versions: getExchangeRateAsync, calculateUahAmountAsync, etc.
// ========================================



// ========================================
// LEGACY SYNC FUNCTIONS REMOVED
// Use async versions: getExchangeRateAsync, calculateUahAmountAsync, etc.
// ========================================



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
 * Получить информацию о лимитах для криптовалюты (STATIC VERSION)
 * Заменяет динамические лимиты на основе моков на статические константы
 */
export function getCurrencyLimits(currency: CryptoCurrency) {
  const businessLimits = CRYPTO_BUSINESS_LIMITS[currency];
  return {
    minCrypto: businessLimits.minCrypto,
    maxCrypto: businessLimits.maxCrypto,
    minUSD: AMOUNT_LIMITS.MIN_USD,
    maxUSD: AMOUNT_LIMITS.MAX_USD,
  };
}

/**
 * Получить минимальную сумму криптовалюты для отображения в UI (STATIC VERSION)
 * @param currency - Тип криптовалюты
 * @returns Минимальная сумма для отправки
 * @example
 * const minAmount = getMinCryptoAmountForUI('BTC');
 * console.log(minAmount); // 0.0002 (статичная константа)
 */
export function getMinCryptoAmountForUI(currency: CryptoCurrency): number {
  return CRYPTO_BUSINESS_LIMITS[currency].minCrypto;
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
 * console.log(rate.source); // 'api' | 'fallback'
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
 * НОВАЯ АСИНХРОННАЯ ВЕРСИЯ calculateCommission
 * Использует real-time курсы для более точных расчетов
 * 
 * @param cryptoAmount - Количество криптовалюты
 * @param currency - Тип криптовалюты
 * @returns Размер комиссии в гривнах
 * @example
 * const commission = await calculateCommissionAsync(0.001, 'BTC');
 * console.log(commission); // 52.65 (3% от real-time курса)
 */
export async function calculateCommissionAsync(
  cryptoAmount: number, 
  currency: CryptoCurrency
): Promise<number> {
  const rate = await getExchangeRateAsync(currency);
  const grossAmount = cryptoAmount * rate.uahRate;
  const commission = calculateCommissionAmount(grossAmount, rate.commission);
  return Number(commission.toFixed(PERCENTAGE_CALCULATIONS.UAH_ROUNDING_PRECISION));
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
