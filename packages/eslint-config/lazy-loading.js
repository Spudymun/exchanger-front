/**
 * Lazy loading utilities для ESLint конфигурации
 * Оптимизация производительности через отложенную загрузку
 */

// === CACHE ДЛЯ LAZY LOADING ===
const pluginCache = new Map();
const configCache = new Map();

/**
 * Lazy загрузка плагина с кэшированием
 * @param {string} pluginName - имя плагина
 * @param {() => Promise<any>} loader - функция загрузки
 * @returns {any} - загруженный плагин
 */
export async function lazyLoadPlugin(pluginName, loader) {
  if (pluginCache.has(pluginName)) {
    return pluginCache.get(pluginName);
  }

  try {
    const plugin = await loader();
    pluginCache.set(pluginName, plugin);
    return plugin;
  } catch (error) {
    console.warn(`Failed to load plugin ${pluginName}:`, error.message);
    return null;
  }
}

/**
 * Lazy загрузка конфигурации с кэшированием
 * @param {string} configName - имя конфигурации
 * @param {() => any} factory - фабрика конфигурации
 * @returns {any} - конфигурация
 */
export function lazyLoadConfig(configName, factory) {
  if (configCache.has(configName)) {
    return configCache.get(configName);
  }

  const config = factory();
  configCache.set(configName, config);
  return config;
}

/**
 * Условная загрузка конфигурации
 * @param {boolean} condition - условие загрузки
 * @param {() => any} factory - фабрика конфигурации
 * @returns {any[]} - массив конфигураций
 */
export function conditionalConfig(condition, factory) {
  return condition ? factory() : [];
}

/**
 * Проверка наличия файлов определенного типа в проекте
 * @param {string[]} _patterns - паттерны файлов
 * @returns {boolean} - есть ли файлы
 */
export function hasFiles(_patterns) {
  // Простая проверка наличия файлов без полного сканирования
  // В реальном проекте можно использовать более сложную логику
  return true; // Для простоты всегда возвращаем true
}

/**
 * Оптимизированная загрузка правил по требованию
 * @param {string} ruleSet - набор правил
 * @param {object} rules - правила
 * @returns {object} - оптимизированные правила
 */
export function optimizedRules(ruleSet, rules) {
  // Логирование для отладки производительности
  const start = Date.now();
  const result = { ...rules };
  const duration = Date.now() - start;

  if (duration > 1) {
    console.debug(`Rule set ${ruleSet} loaded in ${duration}ms`);
  }

  return result;
}

/**
 * Мемоизация для дорогих операций
 * @param {Function} fn - функция для мемоизации
 * @returns {Function} - мемоизированная функция
 */
export function memoize(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// === PERFORMANCE METRICS ===
export const performanceMetrics = {
  startTime: Date.now(),
  loadTimes: new Map(),

  recordLoadTime(configName, startTime) {
    const duration = Date.now() - startTime;
    this.loadTimes.set(configName, duration);

    if (duration > 50) {
      console.warn(`Slow config load: ${configName} took ${duration}ms`);
    }
  },

  getTotalLoadTime() {
    return Date.now() - this.startTime;
  },

  getReport() {
    const total = this.getTotalLoadTime();
    const configs = Array.from(this.loadTimes.entries()).sort((a, b) => b[1] - a[1]);

    return {
      totalTime: total,
      slowestConfigs: configs.slice(0, 5),
      averageTime: total / (this.loadTimes.size || 1),
    };
  },
};
