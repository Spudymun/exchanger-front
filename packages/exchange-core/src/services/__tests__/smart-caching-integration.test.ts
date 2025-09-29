/**
 * Тест интеграции Smart Caching с селекторами валют
 */

import type { CryptoCurrency } from '@repo/constants';

import { calculateUahAmountAsync } from '../../utils/calculations';

const TEST_AMOUNT = 1;
const MIN_VALID_RESULT = 0;
const MAX_CACHE_RESPONSE_TIME = 50;

describe('Smart Caching Integration', () => {
  it('возвращает валидные результаты для всех валют', async () => {
    const currencies: CryptoCurrency[] = ['BTC', 'ETH', 'USDT', 'LTC'];
    
    for (const currency of currencies) {
      const result = await calculateUahAmountAsync(TEST_AMOUNT, currency);
      expect(result).toBeGreaterThan(MIN_VALID_RESULT);
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
    }
  });

  it('кеширует результаты для быстрого доступа', async () => {
    // Первый запрос
    const result1 = await calculateUahAmountAsync(TEST_AMOUNT, 'USDT');
    
    // Второй запрос должен использовать кеш
    const startTime = Date.now();
    const result2 = await calculateUahAmountAsync(TEST_AMOUNT, 'USDT');
    const duration = Date.now() - startTime;

    expect(result2).toBe(result1);
    expect(duration).toBeLessThan(MAX_CACHE_RESPONSE_TIME);
  });

  it('возвращает разные курсы для разных валют', async () => {
    const usdtResult = await calculateUahAmountAsync(TEST_AMOUNT, 'USDT');
    const btcResult = await calculateUahAmountAsync(TEST_AMOUNT, 'BTC');

    expect(usdtResult).toBeGreaterThan(MIN_VALID_RESULT);
    expect(btcResult).toBeGreaterThan(MIN_VALID_RESULT);
    expect(usdtResult).not.toBe(btcResult);
  });
});