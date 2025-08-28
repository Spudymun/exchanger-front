import {
  FIAT_CURRENCIES,
  FIAT_MIN_AMOUNTS,
  FIAT_MAX_AMOUNTS,
  MOCK_FIAT_RATES,
  getBanksForCurrency,
  getBankById,
  getBankReserve,
  API_DELAY_MS,
  CRYPTOCURRENCIES,
  PERCENTAGE_CALCULATIONS,
} from '@repo/constants';
import {
  calculateUahAmount,
  getExchangeRate,
  type CryptoCurrency,
  type FiatCurrency,
} from '@repo/exchange-core';
import { createBadRequestError } from '@repo/utils';
import { z } from 'zod';

import { type Context } from '../context';
import { createTRPCRouter, publicProcedure } from '../init';

// === TYPE GUARDS ===

/**
 * Type guard для проверки валидности криптовалюты
 */
async function assertValidCurrency(currency: string, ctx: Context): Promise<void> {
  if (!CRYPTOCURRENCIES.includes(currency as CryptoCurrency)) {
    throw createBadRequestError(
      await ctx.getErrorMessage('server.errors.business.unsupportedCurrency', { currency })
    );
  }
}

export const fiatRouter = createTRPCRouter({
  // Получить поддерживаемые фиатные валюты
  getSupportedFiatCurrencies: publicProcedure.query(async () => {
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));

    return FIAT_CURRENCIES.map((currency: FiatCurrency) => ({
      symbol: currency,
      name: currency === 'UAH' ? 'Українська гривня' : currency === 'USD' ? 'US Dollar' : 'Euro',
      minAmount: FIAT_MIN_AMOUNTS[currency as keyof typeof FIAT_MIN_AMOUNTS],
      maxAmount: FIAT_MAX_AMOUNTS[currency as keyof typeof FIAT_MAX_AMOUNTS],
      isActive: true,
    }));
  }),

  // Получить банки для выбранной фиатной валюты
  getBanksForFiatCurrency: publicProcedure
    .input(z.object({ currency: z.enum(FIAT_CURRENCIES) }))
    .query(async ({ input }) => {
      // Имитация задержки API
      await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));

      const banks = getBanksForCurrency(input.currency as FiatCurrency);
      return banks.map(
        (bank: {
          id: string;
          name: string;
          shortName: string;
          logoUrl: string;
          isActive: boolean;
          priority: number;
        }) => ({
          id: bank.id,
          name: bank.name,
          shortName: bank.shortName,
          logoUrl: bank.logoUrl,
          isActive: bank.isActive,
          priority: bank.priority,
          reserve: getBankReserve(bank.id, input.currency as FiatCurrency),
        })
      );
    }),

  // Получить информацию о банке и его резервах
  getBankInfo: publicProcedure
    .input(
      z.object({
        bankId: z.string(),
        currency: z.enum(FIAT_CURRENCIES),
      })
    )
    .query(async ({ input, ctx }) => {
      // Имитация задержки API
      await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));

      const bank = getBankById(input.bankId);
      if (!bank) {
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.bankNotFound', { bankId: input.bankId })
        );
      }

      const reserve = getBankReserve(input.bankId, input.currency as FiatCurrency);
      const minAmount = FIAT_MIN_AMOUNTS[input.currency as keyof typeof FIAT_MIN_AMOUNTS];

      return {
        id: bank.id,
        name: bank.name,
        shortName: bank.shortName,
        logoUrl: bank.logoUrl,
        isActive: bank.isActive,
        currency: input.currency,
        reserve,
        minAmount,
        maxAmount: Math.min(
          reserve,
          FIAT_MAX_AMOUNTS[input.currency as keyof typeof FIAT_MAX_AMOUNTS]
        ),
      };
    }),

  // Рассчитать обмен с фиатной валютой
  calculateFiatExchange: publicProcedure
    .input(
      z.object({
        cryptoAmount: z.number().positive('AMOUNT_POSITIVE_REQUIRED'),
        fromCurrency: z.enum(CRYPTOCURRENCIES),
        toCurrency: z.enum(FIAT_CURRENCIES),
        bankId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Имитация задержки API
      await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));

      const { cryptoAmount, fromCurrency, toCurrency, bankId } = input;

      await assertValidCurrency(fromCurrency as string, ctx);

      // Проверяем банк
      const bank = getBankById(bankId);
      if (!bank) {
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.bankNotFound', { bankId })
        );
      }

      // Получаем базовый курс криптовалюты в UAH
      const cryptoRate = getExchangeRate(fromCurrency as CryptoCurrency);
      const uahAmount = calculateUahAmount(cryptoAmount as number, fromCurrency as CryptoCurrency);

      // Конвертируем в целевую фиатную валюту
      const fiatRate = MOCK_FIAT_RATES[toCurrency as keyof typeof MOCK_FIAT_RATES];
      const finalAmount = toCurrency === 'UAH' ? uahAmount : uahAmount / fiatRate;

      // Проверяем резерв банка
      const bankReserve = getBankReserve(bankId, toCurrency as FiatCurrency);
      const hasEnoughReserve = finalAmount <= bankReserve;

      return {
        cryptoAmount,
        fromCurrency,
        toCurrency,
        bankId,
        fiatAmount: Number(finalAmount.toFixed(2)),
        cryptoRate: cryptoRate.uahRate,
        fiatRate,
        commission: cryptoRate.commission,
        commissionAmount:
          (cryptoAmount as number) *
          cryptoRate.uahRate *
          (cryptoRate.commission / PERCENTAGE_CALCULATIONS.PERCENT_BASE),
        bankReserve,
        hasEnoughReserve,
        isValid:
          hasEnoughReserve &&
          finalAmount >= FIAT_MIN_AMOUNTS[toCurrency as keyof typeof FIAT_MIN_AMOUNTS],
      };
    }),
});
