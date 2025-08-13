/**
 * Shared CSS utilities - устранение дублирования стилей в business-компонентах
 * Создано для устранения Rule 20 нарушений
 * Базируется на существующих design-tokens
 */

/**
 * Общие стили для карточек - централизовано для business-компонентов
 */
export const cardStyles = {
  base: 'rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow',
  hover: 'hover:shadow-md transition-shadow',
  focus: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
} as const;

/**
 * Общие стили для текста - централизовано для business-компонентов
 */
export const textStyles = {
  heading: {
    sm: 'text-sm font-medium text-gray-900',
    md: 'text-lg font-semibold text-gray-900',
    lg: 'text-xl font-semibold text-gray-900',
  },
  body: {
    sm: 'text-xs text-gray-500',
    md: 'text-sm text-gray-600',
    lg: 'text-base text-gray-700',
  },
  accent: {
    primary: 'text-blue-600',
    secondary: 'text-orange-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  },
} as const;

/**
 * Общие стили для статусов - централизовано для status компонентов
 */
export const statusStyles = {
  success: 'text-green-600 bg-green-50',
  warning: 'text-yellow-600 bg-yellow-50',
  info: 'text-blue-600 bg-blue-50',
  error: 'text-red-600 bg-red-50',
  neutral: 'text-gray-600 bg-gray-50',
} as const;

/**
 * Общие стили для loading состояний
 */
export const loadingStyles = {
  container: 'flex items-center justify-center p-8',
  spinner: 'h-8 w-8 animate-spin',
  text: 'ml-2 text-sm text-gray-600',
} as const;

/**
 * Общие стили для сеток/grid layouts
 */
export const gridStyles = {
  responsive: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
  cards: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
  form: 'grid grid-cols-1 gap-4 sm:grid-cols-2',
} as const;

/**
 * Общие стили для layout компонентов
 */
export const layoutStyles = {
  container: 'container mx-auto py-8',
  fullHeight: 'min-h-screen',
  dashboard: 'flex h-screen',
  sidebar: 'w-64 border-r bg-muted/10',
  mainContent: 'flex-1 overflow-auto',
  header: 'border-b px-6 py-4',
  content: 'p-6',
} as const;

/**
 * Общие стили для заголовков страниц
 */
export const pageStyles = {
  title: {
    hero: 'text-5xl text-center mb-5',
    page: 'text-4xl font-bold mb-2',
    section: 'text-2xl font-bold',
  },
  description: {
    hero: 'text-lg text-center text-gray-600',
    page: 'text-muted-foreground',
  },
  spacing: {
    section: 'mt-8',
    content: 'mb-8',
  },
} as const;

/**
 * Общие стили для кнопок (дополнительные для page компонентов)
 */
export const buttonStyles = {
  primary:
    'px-6 py-3 text-base bg-blue-600 text-white border-0 rounded-md cursor-pointer mr-5 hover:bg-blue-700',
  secondary:
    'px-6 py-3 text-base bg-transparent text-blue-600 border-2 border-blue-600 rounded-md cursor-pointer hover:bg-blue-50',
  center: 'text-center mt-10',
} as const;

/**
 * Общие стили для data-table компонентов
 */
export const tableStyles = {
  container: 'space-y-4',
  wrapper: 'rounded-md border',
  filters: {
    container: 'flex items-center gap-2 mb-4',
    searchWrapper: 'relative flex-1',
    searchIcon: 'absolute left-2 top-2.5 h-4 w-4 text-muted-foreground',
    searchInput: 'pl-8',
    filterButton: 'whitespace-nowrap',
    filterIcon: 'h-4 w-4 mr-2',
  },
} as const;

/**
 * Utility для объединения стилей с поддержкой конфликтов
 */
export function combineStyles(...styles: Array<string | undefined | false>): string {
  return styles.filter(Boolean).join(' ');
}

/**
 * Общие стили для Storybook демонстраций - устранение CSS дублирования
 */
export const storyBookStyles = {
  demoBox: 'bg-blue-500 text-white text-sm rounded px-3 py-1',
  demoButton: 'bg-blue-500 text-white px-4 py-2 rounded text-sm',
  spacingContainer: 'bg-gray-100 dark:bg-gray-800 rounded',
} as const;

/**
 * Типы для type-safe использования стилей
 */
export type CardStyleKeys = keyof typeof cardStyles;
export type TextStyleCategories = keyof typeof textStyles;
export type StatusStyleKeys = keyof typeof statusStyles;
export type LayoutStyleKeys = keyof typeof layoutStyles;
export type PageStyleKeys = keyof typeof pageStyles;
export type TableStyleKeys = keyof typeof tableStyles;
export type StoryBookStyleKeys = keyof typeof storyBookStyles;
