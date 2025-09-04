/* eslint-disable security/detect-object-injection */
/**
 * Enhanced i18n configuration with lazy loading for optimal performance
 *
 * PERFORMANCE FEATURES:
 * 1. Route-based conditional loading (Implemented in Stages 1-2)
 * 2. Server-side caching with Map storage (Implemented in Stage 2)
 * 3. Lazy loading for rare modules (NEW in Stage 3)
 *
 * STAGE 3 IMPROVEMENTS:
 * - Critical vs Lazy module separation
 * - Development mode enhanced loading
 * - Admin features conditional loading
 * - Debug mode server errors
 */
import { headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

/**
 * Route-based translation module mapping for optimal loading
 * Each route loads only required translation modules
 */
interface RouteModuleConfig {
  /** Critical modules - always loaded for this route */
  critical: string[];
  /** Lazy modules - loaded only under specific conditions */
  lazy: string[];
  description: string;
}

type TranslationData = Record<string, unknown>;

interface LoadedModule {
  moduleName: string;
  data: TranslationData;
}

/**
 * Lazy loading conditions - when to load optional modules
 */
interface _LazyLoadingConditions {
  /** Load dashboard/admin modules */
  hasAdminMode: boolean;
  /** Load enhanced trading features */
  hasAdvancedTrading: boolean;
  /** Load server error details */
  hasDebugMode: boolean;
  /** Load all notification types */
  hasFullNotifications: boolean;
}

// Cache for loaded translation modules to avoid repeated imports
const translationCache = new Map<string, TranslationData>();

// Common lazy module constants to avoid duplication
const LAZY_MODULES = {
  DASHBOARD_NAV: 'dashboard-nav',
  NOTIFICATIONS: 'notifications',
  SERVER_ERRORS: 'server-errors',
  COMMON_UI: 'common-ui',
  LAYOUT: 'layout',
  ORDER_PAGE: 'order-page',
} as const;

const ROUTE_MODULE_MAP: Record<string, RouteModuleConfig> = {
  // Home page - 2 critical + 2 lazy modules
  '/': {
    critical: ['home-page', LAZY_MODULES.LAYOUT],
    lazy: [LAZY_MODULES.COMMON_UI, LAZY_MODULES.NOTIFICATIONS],
    description: 'Home page with hero, features, layout',
  },

  // Exchange page - 2 critical + 1 lazy modules
  '/exchange': {
    critical: ['advanced-exchange', LAZY_MODULES.LAYOUT],
    lazy: [LAZY_MODULES.ORDER_PAGE],
    description: 'Exchange page with forms and trading',
  },

  // Error/404 pages - 1 critical + 1 lazy modules
  '/not-found': {
    critical: [LAZY_MODULES.COMMON_UI],
    lazy: [LAZY_MODULES.LAYOUT],
    description: 'Error and 404 pages',
  },
  '/error': {
    critical: [LAZY_MODULES.COMMON_UI],
    lazy: [LAZY_MODULES.LAYOUT],
    description: 'Error pages',
  },

  // Order pages - order status and tracking
  '/order': {
    critical: [LAZY_MODULES.ORDER_PAGE, LAZY_MODULES.LAYOUT, LAZY_MODULES.COMMON_UI],
    lazy: [LAZY_MODULES.NOTIFICATIONS],
    description: 'Order status pages',
  },

  // Admin routes - special handling
  '/admin': {
    critical: [LAZY_MODULES.LAYOUT, LAZY_MODULES.COMMON_UI],
    lazy: [LAZY_MODULES.DASHBOARD_NAV, LAZY_MODULES.NOTIFICATIONS, LAZY_MODULES.SERVER_ERRORS],
    description: 'Admin panel with full feature set',
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
  'order-page': ['order-page', 'OrderStatus'],
} as const;

/**
 * STAGE 3: Determine lazy loading conditions based on environment and user context
 */
function getLazyConditions(headersList: Headers) {
  const isDevMode = process.env.NODE_ENV === 'development';
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = userAgent.includes('Mobile');

  return {
    hasAdminMode: headersList.get('x-admin-mode') === 'true' || isDevMode,
    hasDebugMode: headersList.get('x-debug-mode') === 'true' || isDevMode,
    shouldLoadNotifications: !isMobile || headersList.get('x-notifications') === 'true',
    shouldLoadFullUI: !isMobile,
  };
}

/**
 * STAGE 3: Determine if specific lazy module should be loaded
 */
function shouldLoadLazyModule(
  moduleName: string,
  conditions: ReturnType<typeof getLazyConditions>
): boolean {
  switch (moduleName) {
    case LAZY_MODULES.DASHBOARD_NAV:
      return conditions.hasAdminMode;
    case LAZY_MODULES.SERVER_ERRORS:
      return conditions.hasDebugMode;
    case LAZY_MODULES.NOTIFICATIONS:
      return conditions.shouldLoadNotifications;
    case LAZY_MODULES.COMMON_UI:
      return conditions.shouldLoadFullUI;
    default:
      return true; // Load other lazy modules by default
  }
}

/**
 * Determine which modules to load based on current route with lazy loading
 * STAGE 3: Enhanced with lazy loading conditions and smart fallbacks
 */
function getRequiredModules(pathname: string, headersList: Headers): string[] {
  // Remove locale prefix (e.g., /en/exchange -> /exchange)
  const cleanPath = pathname.replace(/^\/[a-z]{2}/, '') || '/';

  // Find exact route match or pattern match for dynamic routes
  let routeConfig = ROUTE_MODULE_MAP[cleanPath as keyof typeof ROUTE_MODULE_MAP];

  // If no exact match, try pattern matching for dynamic routes
  if (!routeConfig) {
    if (cleanPath.startsWith('/order/')) {
      routeConfig = ROUTE_MODULE_MAP['/order'];
    } else {
      // Add more dynamic route patterns here as needed
    }
  }

  if (!routeConfig) {
    return Object.keys(MODULE_NAMESPACE_MAP);
  }

  // Start with critical modules (always loaded)
  const modules = [...routeConfig.critical];
  const conditions = getLazyConditions(headersList);

  // Add lazy modules based on conditions
  for (const lazyModule of routeConfig.lazy) {
    if (shouldLoadLazyModule(lazyModule, conditions) && !modules.includes(lazyModule)) {
      modules.push(lazyModule);
    }
  }

  return modules;
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

  // ✅ OPTIMIZED LOADING: Load only required modules based on route and lazy conditions
  const requiredModules = getRequiredModules(pathname, headersList);
  const loadedModules = await loadTranslationModules(locale, requiredModules);
  const messages = buildMessages(loadedModules);

  return {
    locale,
    // ✅ PRESERVE TOP-LEVEL NAMESPACES: Critical for component compatibility
    messages,
  };
});
