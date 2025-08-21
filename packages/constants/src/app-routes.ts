/**
 * Централизованные маршруты приложения
 * Устраняет хардкод в навигационных компонентах
 */

// === ОСНОВНЫЕ СТРАНИЦЫ WEB ===
export const APP_ROUTES = {
  /** Главная страница */
  HOME: '/' as const,
  /** Страница заказов пользователя */
  ORDERS: '/orders' as const,
  /** Страница контактов */
  CONTACTS: '/contacts' as const,
  /** Обменник (новый) */
  EXCHANGE: '/exchange' as const,
} as const;

// === АДМИНИСТРАТИВНЫЕ МАРШРУТЫ ===
export const ADMIN_ROUTES = {
  /** Главная страница админ-панели */
  ADMIN_HOME: '/admin' as const,
  /** Dashboard админ-панели */
  DASHBOARD: '/admin/dashboard' as const,
} as const;

// === ИНФОРМАЦИОННЫЕ СТРАНИЦЫ ===
export const INFO_ROUTES = {
  /** Курсы валют */
  RATES: '/rates' as const,
  /** Резервы системы */
  RESERVES: '/reserves' as const,
  /** Лимиты обмена */
  LIMITS: '/limits' as const,
  /** Часто задаваемые вопросы */
  FAQ: '/faq' as const,
  /** Как это работает */
  HOW_IT_WORKS: '/how-it-works' as const,
} as const;

// === ПРАВОВЫЕ СТРАНИЦЫ ===
export const LEGAL_ROUTES = {
  /** Правила обмена */
  RULES: '/rules' as const,
  /** AML политика */
  AML_POLICY: '/aml-policy' as const,
  /** Возвраты */
  RETURNS: '/returns' as const,
  /** Политика конфиденциальности */
  PRIVACY: '/privacy' as const,
} as const;

// === ЯКОРНЫЕ ССЫЛКИ ===
export const ANCHOR_ROUTES = {
  /** Секция обменника на главной */
  EXCHANGE_SECTION: '#exchange-section' as const,
} as const;

// === ТИПЫ ===
export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES];
export type InfoRoute = (typeof INFO_ROUTES)[keyof typeof INFO_ROUTES];
export type LegalRoute = (typeof LEGAL_ROUTES)[keyof typeof LEGAL_ROUTES];
export type AnchorRoute = (typeof ANCHOR_ROUTES)[keyof typeof ANCHOR_ROUTES];
