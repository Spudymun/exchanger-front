import {
  EXPLORER_URLS,
  NETWORK_NAMES,
  CURRENCY_DECIMALS,
  MIN_TRANSACTION_AMOUNTS,
  CURRENCY_SYMBOLS,
  CURRENCY_FULL_NAMES,
  DECIMAL_PRECISION,
  VALIDATION_PATTERNS,
} from '@repo/constants';

import { formatCryptoAmountForUI } from '@repo/utils';

import { generateCryptoDepositAddress } from '../services';

import type { CryptoCurrency } from '../types';

/**
 * Получить случайный адрес для депозита (мок)
 * Uses service function for proper architecture
 */
export function generateDepositAddress(currency: CryptoCurrency): string {
  return generateCryptoDepositAddress(currency);
}

/**
 * Валидация формата крипто-адреса (базовая проверка)
 */
export function validateCryptoAddress(address: string, currency: CryptoCurrency): boolean {
  switch (currency) {
    case 'BTC':
      return VALIDATION_PATTERNS.BTC_ADDRESS.test(address);
    case 'ETH':
    case 'USDT':
      return VALIDATION_PATTERNS.ETH_ADDRESS.test(address);
    case 'LTC':
      return VALIDATION_PATTERNS.LTC_ADDRESS.test(address);
    default:
      return false;
  }
}

/**
 * Получить explorer URL для транзакции
 */
export function getTransactionExplorerUrl(txHash: string, currency: CryptoCurrency): string {
  return `${EXPLORER_URLS[currency]}/${txHash}`;
}

/**
 * Получить название сети для криптовалюты
 */
export function getNetworkName(currency: CryptoCurrency): string {
  return NETWORK_NAMES[currency];
}

/**
 * Получить количество десятичных знаков для криптовалюты
 */
export function getCurrencyDecimals(currency: CryptoCurrency): number {
  return CURRENCY_DECIMALS[currency];
}

/**
 * Форматирование суммы криптовалюты с правильным количеством знаков
 */
export function formatCryptoAmount(amount: number, currency: CryptoCurrency): string {
  const decimals = getCurrencyDecimals(currency);
  return formatCryptoAmountForUI(
    amount,
    Math.min(decimals, DECIMAL_PRECISION.UI_MAX_DECIMAL_PLACES)
  );
}

/**
 * Получить минимальную сумму для транзакции в криптовалюте
 */
export function getMinTransactionAmount(currency: CryptoCurrency): number {
  return MIN_TRANSACTION_AMOUNTS[currency];
}

/**
 * Проверить, достаточна ли сумма для транзакции
 */
export function isTransactionAmountValid(amount: number, currency: CryptoCurrency): boolean {
  const minAmount = getMinTransactionAmount(currency);
  return amount >= minAmount;
}

/**
 * Получить символ криптовалюты для отображения
 */
export function getCurrencySymbol(currency: CryptoCurrency): string {
  return CURRENCY_SYMBOLS[currency];
}

/**
 * Получить полное название криптовалюты
 */
export function getCurrencyFullName(currency: CryptoCurrency): string {
  return CURRENCY_FULL_NAMES[currency];
}
