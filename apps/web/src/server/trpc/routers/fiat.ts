import {
  FIAT_CURRENCIES,
  FIAT_MIN_AMOUNTS,
  FIAT_MAX_AMOUNTS,
  // MOCK_FIAT_RATES, // ВРЕМЕННО ЗАКОММЕНТИРОВАНО: мультивалютная конвертация
  API_DELAY_MS,
  CRYPTOCURRENCIES,
  PERCENTAGE_CALCULATIONS,
} from '@repo/constants';
import {
  calculateUahAmountAsync,
  getExchangeRateAsync,
  type CryptoCurrency,
  type FiatCurrency,
} from '@repo/exchange-core';
import { createBadRequestError } from '@repo/utils';
import { z } from 'zod';

import { getConfiguredPrismaClient } from '../../utils/get-prisma';
import { type Context } from '../context';
import { createTRPCRouter, publicProcedure } from '../init';

// === CONSTANTS ===

const DATABASE_URL_ERROR = 'DATABASE_URL not configured';

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

    // Получаем данные из БД
    const prisma = getConfiguredPrismaClient();

    const currencies = await prisma.bankFiatCurrency.findMany({
      where: { isEnabled: true },
      select: { fiatCurrency: true },
      distinct: ['fiatCurrency'],
    });

    return currencies.map(({ fiatCurrency }) => ({
      symbol: fiatCurrency as FiatCurrency,
      name:
        fiatCurrency === 'UAH'
          ? 'Українська гривня'
          : fiatCurrency === 'USD'
            ? 'US Dollar'
            : 'Euro',
      minAmount: FIAT_MIN_AMOUNTS[fiatCurrency as keyof typeof FIAT_MIN_AMOUNTS],
      maxAmount: FIAT_MAX_AMOUNTS[fiatCurrency as keyof typeof FIAT_MAX_AMOUNTS],
      isActive: true,
    }));
  }),

  // Получить банки для выбранной фиатной валюты
  getBanksForFiatCurrency: publicProcedure
    .input(z.object({ currency: z.enum(FIAT_CURRENCIES) }))
    .query(async ({ input }) => {
      // Имитация задержки API
      await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));

      // Получаем данные из БД
      const prisma = getConfiguredPrismaClient();

      const banksWithCurrency = await prisma.bank.findMany({
        where: {
          isActive: true,
          fiatCurrencies: {
            some: {
              fiatCurrency: input.currency,
              isEnabled: true,
            },
          },
        },
        include: {
          reserves: {
            where: { fiatCurrency: input.currency },
          },
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      });

      return banksWithCurrency.map((bank, index) => ({
        id: bank.externalId,
        name: bank.name,
        shortName: bank.shortName,
        logoUrl: bank.logoUrl || '',
        isActive: bank.isActive,
        isDefault: bank.isDefault, // ✅ MIGRATION: Добавляем поле is_default из БД
        priority: index + 1, // Dynamic priority based on order
        reserve: bank.reserves[0]?.amount ? Number(bank.reserves[0].amount) : 0,
      }));
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

      // Получаем данные из БД
      const prisma = getConfiguredPrismaClient();

      // Проверяем банк и получаем резерв
      const bank = await prisma.bank.findUnique({
        where: { externalId: input.bankId },
        include: {
          reserves: {
            where: { fiatCurrency: input.currency },
          },
        },
      });

      if (!bank) {
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.bankNotFound', { bankId: input.bankId })
        );
      }

      const reserve = bank.reserves[0]?.amount ? Number(bank.reserves[0].amount) : 0;
      const minAmount = FIAT_MIN_AMOUNTS[input.currency as keyof typeof FIAT_MIN_AMOUNTS];

      return {
        id: bank.externalId,
        name: bank.name,
        shortName: bank.shortName,
        logoUrl: bank.logoUrl || '',
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

      // Получаем данные из БД
      const { getPrismaClient } = await import('@repo/session-management');
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error(DATABASE_URL_ERROR);
      }
      const prisma = getPrismaClient({ url: databaseUrl });

      // Проверяем банк и получаем резерв
      const bank = await prisma.bank.findUnique({
        where: { externalId: bankId },
        include: {
          reserves: {
            where: { fiatCurrency: toCurrency },
          },
        },
      });

      if (!bank) {
        throw createBadRequestError(
          await ctx.getErrorMessage('server.errors.business.bankNotFound', { bankId })
        );
      }

      // Получаем базовый курс криптовалюты в UAH
      const cryptoRate = await getExchangeRateAsync(fromCurrency as CryptoCurrency);
      const uahAmount = await calculateUahAmountAsync(
        cryptoAmount as number,
        fromCurrency as CryptoCurrency
      );

      // ВРЕМЕННО ЗАКОММЕНТИРОВАНО: Мультивалютная конвертация (только UAH пока)
      // const fiatRate = MOCK_FIAT_RATES[toCurrency as keyof typeof MOCK_FIAT_RATES];
      // const finalAmount = toCurrency === 'UAH' ? uahAmount : uahAmount / fiatRate;

      // ТЕКУЩАЯ ЛОГИКА: Только UAH
      const finalAmount = uahAmount; // Всегда UAH
      const fiatRate = 1; // UAH базовая валюта

      // Проверяем резерв банка из БД
      const bankReserve = bank.reserves[0]?.amount ? Number(bank.reserves[0].amount) : 0;
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
