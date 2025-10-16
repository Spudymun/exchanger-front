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
    LTC: 'LTCUAH',
    // USDT использует P2P API (не Spot)
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
    staticMargin: 0.045, // 4.5% базовая маржа
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
// BINANCE P2P API КОНФИГУРАЦИЯ
// ==============================

/**
 * Параметры запроса к Binance P2P API
 */
export const BINANCE_P2P_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_ROWS: 15, // Количество объявлений для анализа
  DEFAULT_TRANS_AMOUNT: '2600', // Средняя сумма транзакции для фильтрации
  DEFAULT_COUNTRIES: ['UA'] as const,
  PUBLISHER_TYPE: 'merchant' as const,
  MERCHANT_CHECK: true,
  TRADE_TYPE: 'BUY' as const,
  PAY_TYPES: ['Monobank', 'PrivatBank', 'ABank'] as const, // Украинские банки
} as const;

/**
 * Фильтры качества P2P объявлений
 * Используются для отбора надежных мерчантов
 */
export const P2P_QUALITY_FILTERS = {
  MIN_MONTH_FINISH_RATE: 0.9, // 90% завершённых сделок за месяц
  MIN_POSITIVE_RATE: 0.95, // 95% положительных отзывов
  MIN_MONTH_ORDER_COUNT: 100, // Минимум 100 сделок за месяц
  TOP_ADS_COUNT: 5, // Берём топ-5 объявлений для расчета средневзвешенного
} as const;

// ==============================
// ТИПЫ ДЛЯ TYPESCRIPT
// ==============================

/**
 * Структура объявления P2P от Binance API
 */
export interface P2PAd {
  adv: {
    price: string; // Цена за 1 USDT в UAH
    surplusAmount: string; // Доступная ликвидность
    minSingleTransAmount: string;
    maxSingleTransAmount: string;
    tradeMethods: Array<{ payType: string }>;
  };
  advertiser: {
    monthFinishRate: number; // Процент завершенных сделок за месяц (0-1)
    positiveRate: number; // Процент положительных отзывов (0-1)
    monthOrderCount: number; // Количество сделок за месяц
  };
}

/**
 * Ответ от Binance P2P API
 */
export interface BinanceP2PResponse {
  data: P2PAd[];
  total: number;
  success: boolean;
}

/**
 * Кешированный курс с метаданными
 */
export interface CachedRate {
  rate: number;
  timestamp: number;
  source: 'binance' | 'binance-p2p';
}

/**
 * Ответ от Binance API
 */
export interface BinanceResponse {
  symbol: string;
  price: string;
}