/**
 * Конфигурация API провайдеров для получения курсов криптовалют
 * Централизованные настройки всех внешних API
 */

import type { CryptoCurrency } from './exchange-currencies';
import { API_CURRENCY_SYMBOLS } from './pricing-config';

// ==============================
// ИНТЕРФЕЙСЫ API ПРОВАЙДЕРОВ
// ==============================

/**
 * Конфигурация API провайдера
 */
export interface ApiProvider {
  name: 'binance' | 'coingecko';
  priority: number;
  timeout: number;
  reliability: 'HIGH' | 'MEDIUM';
  getUrl: (currency: CryptoCurrency) => string;
}

// ==============================
// КОНФИГУРАЦИЯ API ПРОВАЙДЕРОВ
// ==============================

/**
 * Конфигурация API провайдеров в порядке приоритета
 * Иерархия: Binance → CoinGecko → Cache → Static Fallback
 */
export const API_PROVIDERS: ApiProvider[] = [
  {
    name: 'binance',
    priority: 1,
    timeout: 5000, // 5 секунд
    reliability: 'HIGH',
    getUrl: (currency: CryptoCurrency) => {
      const symbol = API_CURRENCY_SYMBOLS.binance[currency as keyof typeof API_CURRENCY_SYMBOLS.binance];
      return `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
    },
  },
  {
    name: 'coingecko',
    priority: 2,
    timeout: 8000, // 8 секунд
    reliability: 'HIGH',
    getUrl: (currency: CryptoCurrency) => {
      const coinId = API_CURRENCY_SYMBOLS.coingecko[currency as keyof typeof API_CURRENCY_SYMBOLS.coingecko];
      return `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,uah`;
    },
  },
];

// ==============================
// HTTP КЛИЕНТ КОНФИГУРАЦИЯ
// ==============================

/**
 * Общие значения для заголовков
 */
const USER_AGENT = 'ExchangeGO/1.0';
const ACCEPT_JSON = 'application/json';

/**
 * Заголовки для HTTP запросов к API
 */
export const API_HEADERS = {
  DEFAULT: {
    Accept: ACCEPT_JSON,
    'User-Agent': USER_AGENT,
  },
  BINANCE: {
    Accept: ACCEPT_JSON,
    'User-Agent': USER_AGENT,
  },
  COINGECKO: {
    Accept: ACCEPT_JSON,
    'User-Agent': USER_AGENT,
  },
} as const;

// ==============================
// RETRY И ERROR HANDLING
// ==============================

/**
 * Конфигурация повторных попыток для API запросов
 */
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000, // 1 секунда базовая задержка
  BACKOFF_MULTIPLIER: 2, // Экспоненциальный рост задержки: 1s, 2s, 4s
  JITTER_MAX_MS: 500, // Максимальная случайная задержка для избежания thundering herd
} as const;

/**
 * HTTP статус коды для обработки ошибок
 */
export const API_HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Список HTTP статусов, при которых имеет смысл повторить запрос
 */
export const RETRYABLE_HTTP_STATUSES = [
  API_HTTP_STATUS.TOO_MANY_REQUESTS,
  API_HTTP_STATUS.INTERNAL_SERVER_ERROR,
  API_HTTP_STATUS.BAD_GATEWAY,
  API_HTTP_STATUS.SERVICE_UNAVAILABLE,
  API_HTTP_STATUS.GATEWAY_TIMEOUT,
] as const;

// ==============================
// URL ПОСТРОИТЕЛИ
// ==============================

/**
 * Базовые URL для API провайдеров
 */
export const API_BASE_URLS = {
  BINANCE: 'https://api.binance.com/api/v3',
  COINGECKO: 'https://api.coingecko.com/api/v3',
} as const;

/**
 * Специфичные эндпоинты для каждого API
 */
export const PRICING_API_ENDPOINTS = {
  BINANCE: {
    TICKER_PRICE: '/ticker/price',
  },
  COINGECKO: {
    SIMPLE_PRICE: '/simple/price',
  },
} as const;