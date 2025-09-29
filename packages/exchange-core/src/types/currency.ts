import { type CryptoCurrency } from '@repo/constants';

// Re-export the centralized type for backward compatibility
export type { CryptoCurrency };

/**
 * Базовый интерфейс для курса валюты
 */
export interface ExchangeRate {
  currency: CryptoCurrency;
  usdRate: number;
  uahRate: number;
  commission: number;
  lastUpdated: Date;
}

/**
 * Расширенный курс валюты для гибридной системы ценообразования
 * Включает информацию об источнике данных и spread'е
 */
export interface HybridExchangeRate extends ExchangeRate {
  /** Источник данных: api (real-time) или fallback (резервный курс) */
  source: 'api' | 'fallback';
  /** Маржа/spread применяемая к курсу */
  spread: number;
  /** Время последнего обновления через API */
  lastApiUpdate: Date;
}

export interface CurrencyInfo {
  symbol: CryptoCurrency;
  name: string;
  decimals: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

export interface ExchangeRate {
  currency: CryptoCurrency;
  usdRate: number;
  uahRate: number;
  commission: number;
  lastUpdated: Date;
}

/**
 * Метаданные ответа системы ценообразования
 * Содержит статистику источников данных для мониторинга
 */
export interface PricingMetadata {
  /** Количество валют с реальными курсами от API */
  realTimeCount: number;
  /** Количество валют с fallback курсами */
  fallbackCount: number;
  /** Ошибка системы ценообразования (если есть) */
  error?: string;
}
