/* eslint-disable security/detect-object-injection */
import { headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

/**
 * Route-based translation module mapping for optimal loading
 * Each route loads only required translation modules
 */
interface RouteModuleConfig {
  modules: string[];
  description: string;
}

type TranslationData = Record<string, unknown>;

interface LoadedModule {
  moduleName: string;
  data: TranslationData;
}

// Cache for loaded translation modules to avoid repeated imports
const translationCache = new Map<string, TranslationData>();

const ROUTE_MODULE_MAP: Record<string, RouteModuleConfig> = {
  // Home page - 4/8 modules (50% reduction)
  '/': {
    modules: ['home-page', 'layout', 'common-ui', 'notifications'],
    description: 'Home page with hero, features, layout',
  },

  // Exchange page - 3/8 modules (62% reduction)
  '/exchange': {
    modules: ['advanced-exchange', 'layout', 'notifications'],
    description: 'Exchange page with forms and trading',
  },

  // Error/404 pages - 2/8 modules (75% reduction)
  '/not-found': {
    modules: ['common-ui', 'layout'],
    description: 'Error and 404 pages',
  },
  '/error': {
    modules: ['common-ui', 'layout'],
    description: 'Error pages',
  },
};

/**
 * All available translation modules with their namespaces
 */
const MODULE_NAMESPACE_MAP = {
  'home-page': ['HomePage'],
  layout: ['Layout'],
  'advanced-exchange': ['AdvancedExchangeForm'],
  'server-errors': ['server'],
  notifications: ['notifications'],
  'exchange-trading': ['exchange', 'trading', 'portfolio'],
  'common-ui': ['common', 'theme', 'NotFound', 'Error'],
  'dashboard-nav': ['dashboard', 'navigation'],
} as const;

/**
 * Determine which modules to load based on current route
 */
function getRequiredModules(pathname: string): string[] {
  // Remove locale prefix (e.g., /en/exchange -> /exchange)
  const cleanPath = pathname.replace(/^\/[a-z]{2}/, '') || '/';

  // Find exact route match or fallback to all modules
  const routeConfig = ROUTE_MODULE_MAP[cleanPath as keyof typeof ROUTE_MODULE_MAP];

  if (routeConfig) {
    return routeConfig.modules;
  }

  // Fallback: load all modules for unknown routes
  return Object.keys(MODULE_NAMESPACE_MAP);
}

/**
 * Load translation modules conditionally based on route with caching
 */
async function loadTranslationModules(
  locale: string,
  requiredModules: string[]
): Promise<LoadedModule[]> {
  const modulePromises = requiredModules.map(async (moduleName): Promise<LoadedModule> => {
    const cacheKey = `${locale}-${moduleName}`;

    // Check cache first
    if (translationCache.has(cacheKey)) {
      const cachedData = translationCache.get(cacheKey);
      if (cachedData) {
        return { moduleName, data: cachedData };
      }
    }

    try {
      const module = await import(`../../messages/${locale}/${moduleName}.json`);
      const data = module.default as TranslationData;

      // Cache the loaded module
      translationCache.set(cacheKey, data);

      return { moduleName, data };
    } catch {
      // Cache empty data for failed modules to avoid repeated attempts
      const emptyData = {};
      translationCache.set(cacheKey, emptyData);
      return { moduleName, data: emptyData };
    }
  });

  return Promise.all(modulePromises);
}

/**
 * Safely extract namespace data from loaded module
 */
function extractNamespaceData(data: TranslationData, namespace: string): TranslationData {
  if (Object.prototype.hasOwnProperty.call(data, namespace)) {
    const namespaceData = data[namespace];
    return typeof namespaceData === 'object' && namespaceData !== null
      ? (namespaceData as TranslationData)
      : {};
  }
  return {};
}

/**
 * Build messages object with all required namespaces
 */
function buildMessages(loadedModules: LoadedModule[]): Record<string, TranslationData> {
  const messages: Record<string, TranslationData> = {};

  // Build complete messages object with all expected namespaces
  for (const { moduleName, data } of loadedModules) {
    const namespaces = MODULE_NAMESPACE_MAP[moduleName as keyof typeof MODULE_NAMESPACE_MAP];

    if (!namespaces) continue;

    for (const namespace of namespaces) {
      const namespaceKey = namespace as string;
      messages[namespaceKey] = extractNamespaceData(data, namespace);
    }
  }

  return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // Get current pathname for route-based optimization
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '/';

  // ✅ OPTIMIZED LOADING: Load only required modules based on route
  const requiredModules = getRequiredModules(pathname);
  const loadedModules = await loadTranslationModules(locale, requiredModules);
  const messages = buildMessages(loadedModules);

  return {
    locale,
    // ✅ PRESERVE TOP-LEVEL NAMESPACES: Critical for component compatibility
    messages,
  };
});
