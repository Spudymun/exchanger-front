/**
 * Banking-related constants for ExchangeGO
 * Based on exchanger_AC.md requirements for different fiat currencies
 */

import type { FiatCurrency } from './fiat-currencies';

// Bank configurations for each fiat currency
export const BANKS_BY_CURRENCY = {
  UAH: [
    {
      id: 'privatbank',
      name: 'ПриватБанк',
      shortName: 'Приват',
      logoUrl: '/images/banks/privatbank.svg',
      isActive: true,
      priority: 1,
    },
    {
      id: 'monobank',
      name: 'Монобанк',
      shortName: 'Моно',
      logoUrl: '/images/banks/monobank.svg',
      isActive: true,
      priority: 2,
    },
    {
      id: 'pumb',
      name: 'ПУМБ',
      shortName: 'ПУМБ',
      logoUrl: '/images/banks/pumb.svg',
      isActive: true,
      priority: 3,
    },
    {
      id: 'oschadbank',
      name: 'Ощадбанк',
      shortName: 'Ощад',
      logoUrl: '/images/banks/oschadbank.svg',
      isActive: true,
      priority: 4,
    },
  ],
  USD: [
    {
      id: 'wise',
      name: 'Wise',
      shortName: 'Wise',
      logoUrl: '/images/banks/wise.svg',
      isActive: true,
      priority: 1,
    },
    {
      id: 'payoneer',
      name: 'Payoneer',
      shortName: 'Payoneer',
      logoUrl: '/images/banks/payoneer.svg',
      isActive: true,
      priority: 2,
    },
    {
      id: 'revolut',
      name: 'Revolut',
      shortName: 'Revolut',
      logoUrl: '/images/banks/revolut.svg',
      isActive: true,
      priority: 3,
    },
  ],
  EUR: [
    {
      id: 'revolut_eur',
      name: 'Revolut',
      shortName: 'Revolut',
      logoUrl: '/images/banks/revolut.svg',
      isActive: true,
      priority: 1,
    },
    {
      id: 'wise_eur',
      name: 'Wise',
      shortName: 'Wise',
      logoUrl: '/images/banks/wise.svg',
      isActive: true,
      priority: 2,
    },
    {
      id: 'n26',
      name: 'N26',
      shortName: 'N26',
      logoUrl: '/images/banks/n26.svg',
      isActive: true,
      priority: 3,
    },
  ],
} as const;

// Bank interface for type safety
export interface Bank {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  isActive: boolean;
  priority: number;
}

// Helper to get all bank IDs
export const ALL_BANK_IDS = Object.values(BANKS_BY_CURRENCY)
  .flat()
  .map(bank => bank.id);

// Mock reserves for each bank (per currency)
export const MOCK_BANK_RESERVES = {
  // UAH banks
  privatbank: { UAH: 10000000, USD: 0, EUR: 0 },
  monobank: { UAH: 5000000, USD: 0, EUR: 0 },
  pumb: { UAH: 3000000, USD: 0, EUR: 0 },
  oschadbank: { UAH: 2000000, USD: 0, EUR: 0 },

  // USD banks
  wise: { UAH: 0, USD: 150000, EUR: 0 },
  payoneer: { UAH: 0, USD: 100000, EUR: 0 },
  revolut: { UAH: 0, USD: 80000, EUR: 0 },

  // EUR banks
  revolut_eur: { UAH: 0, USD: 0, EUR: 70000 },
  wise_eur: { UAH: 0, USD: 0, EUR: 60000 },
  n26: { UAH: 0, USD: 0, EUR: 50000 },
} as const;

// Helper function to get banks for specific currency
export function getBanksForCurrency(currency: FiatCurrency): readonly Bank[] {
  const banks = BANKS_BY_CURRENCY[currency as keyof typeof BANKS_BY_CURRENCY];
  return banks || [];
}

// Helper function to get bank by ID
export function getBankById(bankId: string): Bank | undefined {
  for (const banks of Object.values(BANKS_BY_CURRENCY)) {
    const bank = banks.find(b => b.id === bankId);
    if (bank) return bank;
  }
  return undefined;
}

// Helper function to get reserve for bank and currency
export function getBankReserve(bankId: string, currency: FiatCurrency): number {
  const reserves = MOCK_BANK_RESERVES[bankId as keyof typeof MOCK_BANK_RESERVES];
  const DEFAULT_RESERVE = 0;
  return reserves?.[currency as keyof typeof reserves] || DEFAULT_RESERVE;
}
