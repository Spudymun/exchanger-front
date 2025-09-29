import {
  COMMISSION_RATES,
  type CryptoCurrency,
  // Pricing configuration constants
  LOG_JSON_INDENT,
  RATE_CONSTANTS,
  API_CURRENCY_SYMBOLS,
  CURRENCY_PRICING_CONFIG,
  SMART_CACHE_CONFIG,
  type CurrencyConfig,
  type CachedRate,
  type BinanceResponse,
  type CoinGeckoResponse,
  // API configuration
  API_PROVIDERS,
  type ApiProvider,
} from '@repo/constants';

import type { HybridExchangeRate } from '../types/currency';

const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`${timestamp} INFO[SmartPricingService] ${message}`);
    if (data) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(data, null, LOG_JSON_INDENT));
    }
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.warn(`${timestamp} WARN[SmartPricingService] ${message}`);
    if (data) {
      // eslint-disable-next-line no-console
      console.warn(JSON.stringify(data, null, LOG_JSON_INDENT));
    }
  },
  verbose: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      // eslint-disable-next-line no-console
      console.log(`${timestamp} VERBOSE[SmartPricingService] ${message}`);
      if (data) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(data, null, LOG_JSON_INDENT));
      }
    }
  },
};

// Константы теперь импортируются из @repo/constants

// Все интерфейсы и константы теперь импортируются из @repo/constants

/**
 * Smart Pricing Service - Полная гибридная система ценообразования
 * 
 * Реализует ПРАВИЛЬНУЮ архитектуру:
 * - ВСЕ валюты (BTC, ETH, USDT, LTC): Real-time курсы через API
 * - Иерархия провайдеров: Binance → CoinGecko → Cache → Static Fallback
 * - Интеграция с селекторами валют для динамического обновления
 * - Кеширование и graceful degradation
 */
export class SmartPricingService {
  private readonly config = CURRENCY_PRICING_CONFIG;

  private rateCache = new Map<CryptoCurrency, CachedRate>();
  
  // 🚀 SMART CACHING для быстрого переключения селекторов  
  private readonly CACHE_FRESH_MS = SMART_CACHE_CONFIG.FRESH_MS;
  private readonly CACHE_STALE_MS = SMART_CACHE_CONFIG.STALE_MS;
  private backgroundUpdatePromises = new Map<CryptoCurrency, Promise<void>>();

  /**
   * 🎯 SMART CACHING: Получить курс с мгновенным откликом
   * 
   * Логика stale-while-revalidate:
   * 1. Есть свежий кеш (<30сек) → возвращаем мгновенно
   * 2. Есть устаревший кеш (30сек-5мин) → возвращаем мгновенно + обновляем фоном
   * 3. Кеш очень старый (>5мин) → возвращаем + обновляем фоном
   * 4. Кеша нет → делаем синхронный запрос
   */
  async getSafeExchangeRate(currency: CryptoCurrency): Promise<HybridExchangeRate> {
    const cached = this.getCachedRate(currency);
    
    // Есть кеш любого возраста - возвращаем мгновенно
    if (cached) {
      const isFresh = this.isCacheFresh(cached);
      
      // 💾 Логирование использования кеша
      logger.verbose(`Using cached rate for ${currency}`, {
        source: 'cache',
        originalSource: cached.source,
        rate: cached.rate,
        isFresh,
        cacheAge: Date.now() - cached.timestamp,
      });
      
      // Если кеш устарел - запускаем фоновое обновление
      if (!isFresh) {
        this.updateRateInBackground(currency);
      }
      
      // Возвращаем кешированное значение для мгновенного отклика
      return this.createSuccessfulRate(currency, cached.rate, 'cache');
    }

    // Кеша нет - делаем синхронный запрос
    return await this.fetchFreshRate(currency);
  }

  /**
   * Получить свежий курс синхронно (только если кеша нет совсем)
   */
  private async fetchFreshRate(currency: CryptoCurrency): Promise<HybridExchangeRate> {
    // Пробуем получить курс через API провайдеры
    const apiRate = await this.tryApiProviders(currency);
    if (apiRate) {
      return apiRate;
    }

    // Последний рубеж - статический fallback
    return this.getStaticFallbackRate(currency);
  }

  /**
   * 🔄 Фоновое обновление курса (не блокирует UI)
   */
  private updateRateInBackground(currency: CryptoCurrency): void {
    // Предотвращаем множественные фоновые запросы для одной валюты
    if (this.backgroundUpdatePromises.has(currency)) {
      return;
    }

    const updatePromise = this.performBackgroundUpdate(currency);
    this.backgroundUpdatePromises.set(currency, updatePromise);

    // Очищаем promise после завершения
    void updatePromise.finally(() => {
      this.backgroundUpdatePromises.delete(currency);
    });
  }

  /**
   * Выполнить фоновое обновление курса
   */
  private async performBackgroundUpdate(currency: CryptoCurrency): Promise<void> {
    try {
      const freshRate = await this.tryApiProviders(currency);
      if (freshRate) {
        // Обновляем кеш с новыми данными
        this.saveToCache(currency, freshRate.uahRate, 'binance');
      }
    } catch {
      // Тихо игнорируем ошибки фонового обновления
      // чтобы не засорять консоль
    }
  }

  /**
   * Проверить, свежий ли кеш (<30 секунд)
   */
  private isCacheFresh(cached: CachedRate): boolean {
    return Date.now() - cached.timestamp < this.CACHE_FRESH_MS;
  }

  /**
   * Проверить, устаревший ли кеш (30сек - 5мин)
   */
  private isCacheStale(cached: CachedRate): boolean {
    const age = Date.now() - cached.timestamp;
    return age >= this.CACHE_FRESH_MS && age < this.CACHE_STALE_MS;
  }

  /**
   * Попытка получить курс через API провайдеры
   */
  private async tryApiProviders(currency: CryptoCurrency): Promise<HybridExchangeRate | null> {
    for (const provider of API_PROVIDERS) {
      const rate = await this.tryProviderSafely(provider, currency);
      if (rate) {
        return rate;
      }
    }
    return null;
  }

  /**
   * Безопасная попытка получить курс от одного провайдера
   */
  private async tryProviderSafely(provider: ApiProvider, currency: CryptoCurrency): Promise<HybridExchangeRate | null> {
    try {
      const rate = await this.fetchFromProvider(provider, currency);
      if (rate && this.isValidRate(rate)) {
        this.saveToCache(currency, rate, provider.name);
        return this.createSuccessfulRate(currency, rate, provider.name);
      }
      return null;
    } catch {
      // Переходим к следующему провайдеру
      return null;
    }
  }

  /**
   * Сохранить курс в кеш
   */
  private saveToCache(currency: CryptoCurrency, rate: number, source: 'binance' | 'coingecko'): void {
    this.rateCache.set(currency, {
      rate,
      timestamp: Date.now(),
      source,
    });
  }

  /**
   * Получить курс от конкретного провайдера
   */
  private async fetchFromProvider(provider: ApiProvider, currency: CryptoCurrency): Promise<number | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), provider.timeout);

    try {
      const response = await this.makeApiRequest(provider, currency, controller);
      clearTimeout(timeoutId);
      
      const data = await response.json();
      return this.parseProviderResponse(provider.name, data, currency);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Выполнить API запрос к провайдеру
   */
  private async makeApiRequest(provider: ApiProvider, currency: CryptoCurrency, controller: AbortController): Promise<Response> {
    const response = await fetch(provider.getUrl(currency), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ExchangeGO/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${provider.name} API error: ${response.status}`);
    }

    return response;
  }

  /**
   * Парсинг ответа от различных провайдеров
   */
  private parseProviderResponse(providerName: string, data: unknown, currency: CryptoCurrency): number | null {
    try {
      if (providerName === 'binance') {
        return this.parseBinanceResponse(data);
      }

      if (providerName === 'coingecko') {
        return this.parseCoinGeckoResponse(data, currency);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Парсинг ответа от Binance API
   */
  private parseBinanceResponse(data: unknown): number | null {
    const binanceData = data as BinanceResponse;
    const price = parseFloat(binanceData.price);
    return isNaN(price) ? null : price;
  }

  /**
   * Парсинг ответа от CoinGecko API
   */
  private parseCoinGeckoResponse(data: unknown, currency: CryptoCurrency): number | null {
    const coinGeckoData = data as CoinGeckoResponse;
    const coinId = API_CURRENCY_SYMBOLS.coingecko[currency as keyof typeof API_CURRENCY_SYMBOLS.coingecko];
    
    // Безопасная проверка наличия ключа
    if (!(coinId in coinGeckoData)) {
      return null;
    }
    
    const coinData = coinGeckoData[coinId as keyof CoinGeckoResponse];
    const uahRate = coinData?.uah;
    
    return uahRate && !isNaN(uahRate) ? uahRate : null;
  }

  /**
   * Проверка валидности курса
   */
  private isValidRate(rate: number): boolean {
    return rate > RATE_CONSTANTS.VALIDATION.MIN_RATE && isFinite(rate);
  }

  /**
   * Получить кешированный курс если он еще актуален
   */
  private getCachedRate(currency: CryptoCurrency): CachedRate | null {
    const cached = this.rateCache.get(currency);
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > RATE_CONSTANTS.CACHE.MAX_AGE_MS) {
      this.rateCache.delete(currency);
      return null;
    }

    return cached;
  }

  /**
   * Создать успешный результат с применением бизнес-логики
   */
  private createSuccessfulRate(
    currency: CryptoCurrency,
    marketRate: number,
    source: 'binance' | 'coingecko' | 'cache'
  ): HybridExchangeRate {
    const config = this.config[currency as keyof typeof this.config];
    const clientRate = this.applyBusinessLogic(marketRate, config);
    const finalRate = Math.round(clientRate * RATE_CONSTANTS.FORMATTING.KOPECK_MULTIPLIER) / RATE_CONSTANTS.FORMATTING.KOPECK_MULTIPLIER;

    // 📊 Логирование успешного получения курса
    logger.info(`Rate fetched successfully for ${currency}`, {
      source,
      marketRate,
      clientRate: finalRate,
      spread: config.staticMargin,
      competitiveBuffer: config.competitiveBuffer || RATE_CONSTANTS.COMPETITIVE.DEFAULT_BUFFER,
    });

    return {
      currency,
      usdRate: RATE_CONSTANTS.FORMATTING.USD_FALLBACK_RATE,
      uahRate: finalRate,
      commission: COMMISSION_RATES[currency as keyof typeof COMMISSION_RATES],
      lastUpdated: new Date(),
      source: source === 'cache' ? 'fallback' : 'api',
      spread: config.staticMargin,
      lastApiUpdate: new Date(),
    };
  }

  /**
   * Применение бизнес-логики к рыночному курсу
   */
  private applyBusinessLogic(marketRate: number, config: CurrencyConfig): number {
    const { staticMargin, competitiveBuffer = RATE_CONSTANTS.COMPETITIVE.DEFAULT_BUFFER } = config;
    
    // Формула гибридного подхода:
    // clientRate = marketRate * (1 - margin + competitive_advantage)
    const multiplier = RATE_CONSTANTS.BUSINESS_LOGIC.BASE_MULTIPLIER - staticMargin + competitiveBuffer;
    
    return marketRate * multiplier;
  }

  /**
   * Статический fallback курс при полном отказе API
   */
  private getStaticFallbackRate(currency: CryptoCurrency): HybridExchangeRate {
    const config = this.config[currency as keyof typeof this.config];
    const safeRate = config.fallbackRate * RATE_CONSTANTS.FALLBACK.FALLBACK_MULTIPLIER;
    const finalRate = Math.round(safeRate * RATE_CONSTANTS.FORMATTING.KOPECK_MULTIPLIER) / RATE_CONSTANTS.FORMATTING.KOPECK_MULTIPLIER;

    // ⚠️ Логирование использования fallback режима
    logger.warn(`Using static fallback rate for ${currency} - API unavailable`, {
      source: 'fallback',
      fallbackRate: config.fallbackRate,
      safeRate: finalRate,
      spread: RATE_CONSTANTS.FALLBACK.FALLBACK_MULTIPLIER - RATE_CONSTANTS.BUSINESS_LOGIC.BASE_MULTIPLIER,
    });

    return {
      currency,
      usdRate: RATE_CONSTANTS.FORMATTING.USD_FALLBACK_RATE,
      uahRate: finalRate,
      commission: COMMISSION_RATES[currency as keyof typeof COMMISSION_RATES],
      lastUpdated: new Date(),
      source: 'fallback',
      spread: RATE_CONSTANTS.FALLBACK.FALLBACK_MULTIPLIER - RATE_CONSTANTS.BUSINESS_LOGIC.BASE_MULTIPLIER, // 5% spread в fallback
      lastApiUpdate: new Date(RATE_CONSTANTS.DATES.EPOCH_START), // Давняя дата
    };
  }
}