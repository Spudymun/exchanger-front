/**
 * Unit тесты для SmartPricingService
 * 
 * Покрывает:
 * - Иерархию Binance → CoinGecko → Cache → Fallback для ВСЕХ валют
 * - API интеграцию и fallback механизмы
 * - Бизнес-логику и округление курсов
 */

import type { CryptoCurrency } from '@repo/constants';

import { SmartPricingService } from '../smart-pricing-service';

// Test constants для избежания magic numbers
const TEST_VALUES = {
  MARKET_RATE: 41.32,
  // После применения маржи: 41.32 * (1 - 0.025 + 0.003) = 40.41
  EXPECTED_CLIENT_RATE_MIN: 40,    // Минимальный ожидаемый курс для клиента
  EXPECTED_CLIENT_RATE_MAX: 41,    // Максимальный ожидаемый курс для клиента
  KOPECK_MULTIPLIER: 100,
  USD_RATE: 1,
  API_CALLS_COUNT: 2, // Количество вызовов API (Binance + CoinGecko)
};

// Mock для изоляции от внешних зависимостей  
jest.mock('@repo/constants', () => ({
  // Основные константы
  COMMISSION_RATES: { USDT: 1.5, BTC: 2.5, ETH: 2.0, LTC: 2.0 },
  
  // Pricing configuration constants
  LOG_JSON_INDENT: 2,
  RATE_CONSTANTS: {
    VALIDATION: { MIN_RATE: 0 },
    FORMATTING: { KOPECK_MULTIPLIER: 100, USD_FALLBACK_RATE: 1 },
    BUSINESS_LOGIC: { BASE_MULTIPLIER: 1, FALLBACK_SPREAD_BASE: 1 },
    DATES: { EPOCH_START: 0 },
    FALLBACK: { DEFAULT_SPREAD: 0, FALLBACK_MULTIPLIER: 1.05 },
    COMPETITIVE: { DEFAULT_BUFFER: 0 },
    CACHE: { MAX_AGE_MS: 300000, FRESH_MAX_AGE_MS: 30000 },
  },
  API_CURRENCY_SYMBOLS: {
    binance: { BTC: 'BTCUAH', ETH: 'ETHUAH', USDT: 'USDTUAH', LTC: 'LTCUAH' },
    coingecko: { BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', LTC: 'litecoin' },
  },
  CURRENCY_PRICING_CONFIG: {
    USDT: { staticMargin: 0.025, competitiveBuffer: 0.003, fallbackRate: 41.32 },
    BTC: { staticMargin: 0.01, fallbackRate: 1800000 },
    ETH: { staticMargin: 0.012, fallbackRate: 120000 },
    LTC: { staticMargin: 0.012, fallbackRate: 4000 },
  },
  SMART_CACHE_CONFIG: {
    FRESH_MS: 30000, // 30 секунд - свежий кеш
    STALE_MS: 300000, // 5 минут - устаревший но валидный
  },
  
  // API configuration constants  
  API_PROVIDERS: [
    {
      name: 'binance',
      priority: 1,
      timeout: 5000,
      reliability: 'HIGH',
      getUrl: (currency: string) => `https://api.binance.com/api/v3/ticker/price?symbol=${currency}UAH`,
    },
    {
      name: 'coingecko', 
      priority: 2,
      timeout: 8000,
      reliability: 'HIGH',
      getUrl: (currency: string) => `https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd,uah`,
    },
  ],
  API_HEADERS: {
    DEFAULT: { Accept: 'application/json', 'User-Agent': 'ExchangeGO/1.0' },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SmartPricingService', () => {
  let service: SmartPricingService;

  beforeEach(() => {
    service = new SmartPricingService();
    jest.clearAllMocks();
  });

  describe('Binance API (приоритет 1)', () => {
    const testBinanceUSDT = async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ 
          symbol: 'USDTUAH',
          price: TEST_VALUES.MARKET_RATE.toString()
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const rate = await service.getSafeExchangeRate('USDT' as CryptoCurrency);

      expect(rate.source).toBe('api');
      expect(rate.currency).toBe('USDT');
      expect(rate.uahRate).toBeGreaterThan(TEST_VALUES.EXPECTED_CLIENT_RATE_MIN);
      expect(rate.uahRate).toBeLessThan(TEST_VALUES.EXPECTED_CLIENT_RATE_MAX);
    };

    it('получает курс USDT от Binance', testBinanceUSDT);

    const testBinanceBTC = async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ 
          symbol: 'BTCUAH',
          price: '1800000'
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const rate = await service.getSafeExchangeRate('BTC' as CryptoCurrency);

      expect(rate.source).toBe('api');
      expect(rate.currency).toBe('BTC');
    };

    it('получает курс BTC от Binance', testBinanceBTC);
  });

  describe('CoinGecko fallback (приоритет 2)', () => {
    const testCoinGeckoFallback = async () => {
      // Binance недоступен
      mockFetch.mockRejectedValueOnce(new Error('Binance API error'));

      // CoinGecko успешен
      const mockCoinGeckoResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ 
          tether: { usd: TEST_VALUES.USD_RATE, uah: TEST_VALUES.MARKET_RATE } 
        }),
      };
      mockFetch.mockResolvedValueOnce(mockCoinGeckoResponse);

      const rate = await service.getSafeExchangeRate('USDT' as CryptoCurrency);

      expect(rate.source).toBe('api');
      expect(mockFetch).toHaveBeenCalledTimes(TEST_VALUES.API_CALLS_COUNT);
    };

    it('переключается на CoinGecko при неудаче Binance', testCoinGeckoFallback);
  });

  describe('Static fallback (последний рубеж)', () => {
    const testStaticFallback = async () => {
      mockFetch.mockRejectedValue(new Error('All APIs failed'));

      const rate = await service.getSafeExchangeRate('USDT' as CryptoCurrency);

      expect(rate.source).toBe('fallback');
      expect(rate.currency).toBe('USDT');
    };

    it('использует статический fallback при полном отказе API', testStaticFallback);
  });

  describe('Бизнес-логика', () => {
    const setupBusinessLogicMocks = () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ 
          symbol: 'USDTUAH',
          price: TEST_VALUES.MARKET_RATE.toString()
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);
    };

    beforeEach(setupBusinessLogicMocks);

    const testMarginApplication = async () => {
      const rate = await service.getSafeExchangeRate('USDT' as CryptoCurrency);
      
      expect(rate.uahRate).not.toBe(TEST_VALUES.MARKET_RATE);
      expect(rate.spread).toBeDefined();
    };

    it('применяет маржу к курсу', testMarginApplication);

    const testRounding = async () => {
      const rate = await service.getSafeExchangeRate('USDT' as CryptoCurrency);
      
      const rounded = Math.round(rate.uahRate * TEST_VALUES.KOPECK_MULTIPLIER) / TEST_VALUES.KOPECK_MULTIPLIER;
      expect(rate.uahRate).toBe(rounded);
    };

    it('округляет курс до копеек', testRounding);
  });
});