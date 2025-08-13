import {
  EXPLORER_URLS,
  NETWORK_NAMES,
  MIN_TRANSACTION_AMOUNTS,
  CURRENCY_SYMBOLS,
  CURRENCY_FULL_NAMES,
  DECIMAL_PRECISION,
  getCurrencyDecimals,
  type CryptoCurrency,
} from '@repo/constants';

import { formatCryptoAmountForUI, createCryptoAddressSchema } from '@repo/utils';

import { generateCryptoDepositAddress } from '../services';

/**
 * Получить случайный адрес для депозита (мок)
 * Uses service function for proper architecture
 */
export function generateDepositAddress(currency: CryptoCurrency): string {
  return generateCryptoDepositAddress(currency);
}

/**
 * Валидация формата крипто-адреса (базовая проверка)
 * ОБНОВЛЕНО: Использует Zod схемы вместо VALIDATION_PATTERNS
 */
export function validateCryptoAddress(address: string, currency: CryptoCurrency): boolean {
  const schema = createCryptoAddressSchema(currency);
  return schema.safeParse(address).success;
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
