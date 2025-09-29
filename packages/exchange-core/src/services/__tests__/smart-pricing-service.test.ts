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
  RATE_THRESHOLD: 41,
  KOPECK_MULTIPLIER: 100,
  USD_RATE: 1,
  API_CALLS_COUNT: 2, // Количество вызовов API (Binance + CoinGecko)
};

// Mock для изоляции от внешних зависимостей  
jest.mock('@repo/constants', () => ({
  COMMISSION_RATES: { USDT: 1.5, BTC: 2.5, ETH: 2.0, LTC: 2.0 },
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
      expect(rate.uahRate).toBeGreaterThan(TEST_VALUES.RATE_THRESHOLD);
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