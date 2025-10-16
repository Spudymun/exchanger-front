/**
 * Binance P2P Rate Provider
 * Получает курсы криптовалют с Binance P2P платформы
 * 
 * Используется для USDT/UAH чтобы получать реальные P2P цены украинского рынка
 * вместо общего биржевого курса Spot API.
 */

import {
  API_BASE_URLS,
  BINANCE_P2P_CONFIG,
  P2P_QUALITY_FILTERS,
  LOG_JSON_INDENT,
  type CryptoCurrency,
  type P2PAd,
  type BinanceP2PResponse,
} from '@repo/constants';

// Константы для методов
const EMPTY_ARRAY_LENGTH = 0;
const FIRST_ELEMENT_INDEX = 0;
const ARRAY_REDUCE_INITIAL = 0;
const LAST_ELEMENT_OFFSET = 1;

// Простой logger (используем тот же подход что и в SmartPricingService)
const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`${timestamp} INFO[BinanceP2PProvider] ${message}`);
    if (data) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(data, null, LOG_JSON_INDENT));
    }
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.warn(`${timestamp} WARN[BinanceP2PProvider] ${message}`);
    if (data) {
      // eslint-disable-next-line no-console
      console.warn(JSON.stringify(data, null, LOG_JSON_INDENT));
    }
  },
  error: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.error(`${timestamp} ERROR[BinanceP2PProvider] ${message}`);
    if (data) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(data, null, LOG_JSON_INDENT));
    }
  },
};

/**
 * Provider для получения P2P курсов с Binance
 */
export class BinanceP2PProvider {
  /**
   * Получить P2P курс для USDT/UAH
   */
  async getP2PRate(currency: CryptoCurrency, timeout: number): Promise<number | null> {
    // 🧪 СИМУЛЯЦИЯ ОШИБКИ: Для тестирования fallback механизма на Manual DB
    if (process.env.SIMULATE_P2P_ERROR === 'true') {
      logger.warn('⚠️ SIMULATION MODE: P2P API error simulated', {
        currency,
        reason: 'SIMULATE_P2P_ERROR environment variable is set to true',
        fallbackChain: 'Will fallback to: Cache → Manual DB → Error',
      });
      return null;
    }

    if (!this.isCurrencySupported(currency)) {
      return null;
    }

    try {
      const data = await this.fetchP2PData(currency, timeout);
      return this.processP2PResponse(data, currency);
    } catch (error) {
      return this.handleFetchError(error, currency);
    }
  }

  /**
   * Проверить поддерживается ли валюта
   */
  private isCurrencySupported(currency: CryptoCurrency): boolean {
    if (currency !== 'USDT') {
      logger.error(`P2P API не поддерживает валюту ${currency}`, { currency });
      return false;
    }
    return true;
  }

  /**
   * Получить данные из P2P API
   */
  private async fetchP2PData(currency: CryptoCurrency, timeout: number): Promise<BinanceP2PResponse> {
    const body = this.buildRequestBody(currency);
    const response = await this.makeRequest(body, timeout);
    return await response.json() as BinanceP2PResponse;
  }

  /**
   * Выполнить HTTP запрос к P2P API
   */
  private async makeRequest(body: unknown, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(API_BASE_URLS.BINANCE_P2P, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExchangeGO/1.0',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Binance P2P API error: ${response.status}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Обработать ответ от P2P API
   */
  private processP2PResponse(data: BinanceP2PResponse, currency: CryptoCurrency): number | null {
    if (!this.isValidResponse(data)) {
      logger.error('Binance P2P API returned no data', { data });
      return null;
    }

    const rate = this.calculateRateFromAds(data.data);
    
    logger.info(`P2P rate calculated for ${currency}`, {
      rate,
      totalAds: data.total,
      analyzedAds: data.data.length,
    });

    return rate;
  }

  /**
   * Проверить валидность ответа API
   */
  private isValidResponse(data: BinanceP2PResponse): boolean {
    return Boolean(data.success && data.data && data.data.length > EMPTY_ARRAY_LENGTH);
  }

  /**
   * Обработать ошибку запроса
   */
  private handleFetchError(error: unknown, currency: CryptoCurrency): null {
    logger.error('Binance P2P API request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      currency,
    });
    return null;
  }

  /**
   * Построить тело POST запроса для Binance P2P API
   */
  private buildRequestBody(currency: CryptoCurrency) {
    return {
      asset: currency,
      fiat: 'UAH',
      tradeType: BINANCE_P2P_CONFIG.TRADE_TYPE,
      merchantCheck: BINANCE_P2P_CONFIG.MERCHANT_CHECK,
      page: BINANCE_P2P_CONFIG.DEFAULT_PAGE,
      rows: BINANCE_P2P_CONFIG.DEFAULT_ROWS,
      transAmount: BINANCE_P2P_CONFIG.DEFAULT_TRANS_AMOUNT,
      payTypes: [...BINANCE_P2P_CONFIG.PAY_TYPES],
      countries: [...BINANCE_P2P_CONFIG.DEFAULT_COUNTRIES],
      publisherType: BINANCE_P2P_CONFIG.PUBLISHER_TYPE,
    };
  }

  /**
   * Рассчитать курс на основе P2P объявлений
   * Используется weighted average по топ-5 объявлениям
   */
  private calculateRateFromAds(ads: P2PAd[]): number {
    const qualityAds = this.filterQualityAds(ads);
    const topAds = this.selectTopAds(qualityAds);
    return this.calculateWeightedAverage(topAds);
  }

  /**
   * Фильтровать качественные объявления
   */
  private filterQualityAds(ads: P2PAd[]): P2PAd[] {
    const qualityAds = ads.filter(ad => this.isQualityAd(ad));

    if (qualityAds.length === EMPTY_ARRAY_LENGTH) {
      logger.error('No quality P2P ads found after filtering', {
        totalAds: ads.length,
        filters: P2P_QUALITY_FILTERS,
      });
      throw new Error('No quality P2P ads available');
    }

    logger.info('Quality ads filtered', {
      totalAds: ads.length,
      qualityAds: qualityAds.length,
      filterCriteria: P2P_QUALITY_FILTERS,
    });

    return qualityAds;
  }

  /**
   * Проверить является ли объявление качественным
   */
  private isQualityAd(ad: P2PAd): boolean {
    return (
      ad.advertiser.monthFinishRate >= P2P_QUALITY_FILTERS.MIN_MONTH_FINISH_RATE &&
      ad.advertiser.positiveRate >= P2P_QUALITY_FILTERS.MIN_POSITIVE_RATE &&
      ad.advertiser.monthOrderCount >= P2P_QUALITY_FILTERS.MIN_MONTH_ORDER_COUNT
    );
  }

  /**
   * Выбрать топ объявления по цене
   */
  private selectTopAds(ads: P2PAd[]): P2PAd[] {
    return ads
      .sort((a, b) => parseFloat(a.adv.price) - parseFloat(b.adv.price))
      .slice(FIRST_ELEMENT_INDEX, P2P_QUALITY_FILTERS.TOP_ADS_COUNT);
  }

  /**
   * Рассчитать средневзвешенное по ликвидности
   */
  private calculateWeightedAverage(ads: P2PAd[]): number {
    const totalLiquidity = this.calculateTotalLiquidity(ads);
    
    if (totalLiquidity === ARRAY_REDUCE_INITIAL) {
      throw new Error('No liquidity available in P2P ads');
    }

    const weightedSum = ads.reduce((sum, ad) => {
      const price = parseFloat(ad.adv.price);
      const liquidity = parseFloat(ad.adv.surplusAmount);
      const weight = liquidity / totalLiquidity;
      return sum + price * weight;
    }, ARRAY_REDUCE_INITIAL);

    this.logWeightedAverageResult(ads, totalLiquidity, weightedSum);

    return weightedSum;
  }

  /**
   * Рассчитать общую ликвидность
   */
  private calculateTotalLiquidity(ads: P2PAd[]): number {
    return ads.reduce(
      (sum, ad) => sum + parseFloat(ad.adv.surplusAmount),
      ARRAY_REDUCE_INITIAL
    );
  }

  /**
   * Логировать результат расчета
   */
  private logWeightedAverageResult(ads: P2PAd[], totalLiquidity: number, weightedAvg: number): void {
    const firstAd = ads.at(FIRST_ELEMENT_INDEX);
    const lastAd = ads.at(-LAST_ELEMENT_OFFSET);

    if (!firstAd || !lastAd) {
      return;
    }

    logger.info('Weighted average calculated', {
      topAdsCount: ads.length,
      totalLiquidity,
      weightedAvg,
      priceRange: {
        min: parseFloat(firstAd.adv.price),
        max: parseFloat(lastAd.adv.price),
      },
    });
  }
}

