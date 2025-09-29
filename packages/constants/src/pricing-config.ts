/**
 * Конфигурация системы ценообразования
 * Все константы из SmartPricingService централизованы здесь
 */

import type { CryptoCurrency } from './exchange-currencies';

// ==============================
// ОСНОВНЫЕ КОНСТАНТЫ ЛОГИРОВАНИЯ
// ==============================

export const LOG_JSON_INDENT = 2;

// ==============================
// КОНСТАНТЫ ДЛЯ РАСЧЕТОВ
// ==============================

export const RATE_CONSTANTS = {
  VALIDATION: {
    MIN_RATE: 0,
  },
  FORMATTING: {
    KOPECK_MULTIPLIER: 100, // Для округления до копеек
    USD_FALLBACK_RATE: 1,
  },
  BUSINESS_LOGIC: {
    BASE_MULTIPLIER: 1, // Базовый множитель для расчета клиентского курса
    FALLBACK_SPREAD_BASE: 1, // База для расчета spread в fallback режиме
  },
  DATES: {
    EPOCH_START: 0, // Начальная дата для обозначения отсутствия данных
  },
  FALLBACK: {
    DEFAULT_SPREAD: 0, // Дефолтный spread для валют без настроек
    FALLBACK_MULTIPLIER: 1.05, // 5% надбавка в fallback режиме
  },
  COMPETITIVE: {
    DEFAULT_BUFFER: 0, // Дефолтный конкурентный буфер
  },
  CACHE: {
    MAX_AGE_MS: 300000, // 5 минут максимальное время жизни кеша
    FRESH_MAX_AGE_MS: 30000, // 30 секунд свежий кеш
  },
} as const;

// ==============================
// МАПИНГ СИМВОЛОВ ВАЛЮТ ДЛЯ API
// ==============================

export const API_CURRENCY_SYMBOLS = {
  binance: {
    BTC: 'BTCUAH',
    ETH: 'ETHUAH', 
    USDT: 'USDTUAH',
    LTC: 'LTCUAH',
  },
  coingecko: {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    LTC: 'litecoin',
  },
} as const;

// ==============================
// КОНФИГУРАЦИЯ ВАЛЮТ
// ==============================

/**
 * Конфигурация для каждой валюты
 */
export interface CurrencyConfig {
  staticMargin: number;
  competitiveBuffer?: number;
  fallbackRate: number; // Резервный курс UAH
}

/**
 * Полная конфигурация для всех криптовалют
 */
export const CURRENCY_PRICING_CONFIG: Record<CryptoCurrency, CurrencyConfig> = {
  USDT: {
    staticMargin: 0.025, // 2.5% базовая маржа
    competitiveBuffer: 0.003, // 0.3% буфер для конкурентности
    fallbackRate: 41.32, // Резервный курс USDT/UAH
  },
  BTC: {
    staticMargin: 0.01, // 1% маржа
    fallbackRate: 1800000, // Резервный курс BTC/UAH
  },
  ETH: {
    staticMargin: 0.012, // 1.2% маржа
    fallbackRate: 120000, // Резервный курс ETH/UAH
  },
  LTC: {
    staticMargin: 0.012, // 1.2% маржа
    fallbackRate: 4000, // Резервный курс LTC/UAH
  },
} as const;

// ==============================
// ТАЙМИНГИ И КЕШИРОВАНИЕ
// ==============================

/**
 * Конфигурация Smart Caching для быстрого переключения селекторов
 */
export const SMART_CACHE_CONFIG = {
  FRESH_MS: 30000, // 30 секунд - свежий кеш
  STALE_MS: 300000, // 5 минут - устаревший но валидный
} as const;

// ==============================
// ТИПЫ ДЛЯ TYPESCRIPT
// ==============================

/**
 * Кешированный курс с метаданными
 */
export interface CachedRate {
  rate: number;
  timestamp: number;
  source: 'binance' | 'coingecko';
}

/**
 * Ответ от Binance API
 */
export interface BinanceResponse {
  symbol: string;
  price: string;
}

/**
 * Ответ от CoinGecko API
 */
export interface CoinGeckoResponse {
  [key: string]: {
    usd?: number;
    uah?: number;
  };
}