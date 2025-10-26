import {
  FIAT_CURRENCIES,
  FIAT_MIN_AMOUNTS,
  FIAT_MAX_AMOUNTS,
  API_DELAY_MS,
} from '@repo/constants';
import { type FiatCurrency } from '@repo/exchange-core';
import { z } from 'zod';

import { getConfiguredPrismaClient } from '../../utils/get-prisma';
import { createTRPCRouter, publicProcedure } from '../init';

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
});
