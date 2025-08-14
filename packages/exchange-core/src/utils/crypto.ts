import {
  EXPLORER_URLS,
  NETWORK_NAMES,
  MIN_TRANSACTION_AMOUNTS,
  CURRENCY_SYMBOLS,
  CURRENCY_FULL_NAMES,
  type CryptoCurrency,
} from '@repo/constants';

import { createCryptoAddressSchema } from '@repo/utils';

import { generateCryptoDepositAddress } from '../services';

/**
 * Получить случайный адрес для депозита (мок)
 * Uses service function for proper architecture
 * @param currency - Тип криптовалюты
 * @returns Мок адрес для депозита
 * @example
 * const address = generateDepositAddress('BTC');
 * console.log(address); // "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
 */
export function generateDepositAddress(currency: CryptoCurrency): string {
  return generateCryptoDepositAddress(currency);
}

/**
 * Валидация формата крипто-адреса (базовая проверка)
 * ОБНОВЛЕНО: Использует Zod схемы вместо VALIDATION_PATTERNS
 * @param address - Адрес для валидации
 * @param currency - Тип криптовалюты
 * @returns true если адрес валиден, false в противном случае
 * @example
 * const isValid = validateCryptoAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'BTC');
 * console.log(isValid); // true
 */
export function validateCryptoAddress(address: string, currency: CryptoCurrency): boolean {
  const schema = createCryptoAddressSchema(currency);
  return schema.safeParse(address).success;
}

/**
 * Получить explorer URL для транзакции
 * @param txHash - Хеш транзакции
 * @param currency - Тип криптовалюты
 * @returns URL для просмотра транзакции в блокчейн эксплорере
 * @example
 * const url = getTransactionExplorerUrl('abc123...', 'BTC');
 * console.log(url); // "https://blockchain.info/tx/abc123..."
 */
export function getTransactionExplorerUrl(txHash: string, currency: CryptoCurrency): string {
  return `${EXPLORER_URLS[currency]}/${txHash}`;
}

/**
 * Получить название сети для криптовалюты
 * @param currency - Тип криптовалюты
 * @returns Человекочитаемое название сети
 * @example
 * const network = getNetworkName('ETH');
 * console.log(network); // "Ethereum"
 */
export function getNetworkName(currency: CryptoCurrency): string {
  return NETWORK_NAMES[currency];
}

/**
 * Получить минимальную сумму для транзакции в криптовалюте
 * @param currency - Тип криптовалюты
 * @returns Минимальная сумма для транзакции
 * @example
 * const minAmount = getMinTransactionAmount('BTC');
 * console.log(minAmount); // 0.00001
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
