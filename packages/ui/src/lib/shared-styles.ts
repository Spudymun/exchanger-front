/**
 * Shared CSS utilities - устранение дублирования стилей в business-компонентах
 * Создано для устранения Rule 20 нарушений
 * Базируется на существующих design-tokens
 */

/**
 * Общие стили для карточек - централизовано для business-компонентов
 */
export const cardStyles = {
  base: 'rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow',
  hover: 'hover:shadow-md transition-shadow',
  focus: 'focus:ring-2 focus:ring-ring focus:ring-offset-2',
} as const;

/**
 * Общие стили для текста - централизовано для business-компонентов
 */
export const textStyles = {
  heading: {
    sm: 'text-sm font-medium text-foreground',
    md: 'text-lg font-semibold text-foreground',
    lg: 'text-xl font-semibold text-foreground',
  },
  body: {
    sm: 'text-xs text-muted-foreground',
    md: 'text-sm text-muted-foreground',
    lg: 'text-base text-muted-foreground',
  },
  accent: {
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-destructive',
  },
  utility: {
    mono: 'font-mono',
    breakAll: 'break-all',
    monoBreakAll: 'font-mono break-all',
  },
} as const;

/**
 * Общие стили для статусов - централизовано для status компонентов
 */
export const statusStyles = {
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  info: 'text-info bg-info/10',
  error: 'text-destructive bg-destructive/10',
  neutral: 'text-muted-foreground bg-muted/10',
} as const;

/**
 * Общие стили для loading состояний
 */
export const loadingStyles = {
  container: 'flex items-center justify-center p-8',
  spinner: 'h-8 w-8 animate-spin',
  text: 'ml-2 text-sm text-muted-foreground',
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
 * Responsive patterns для устранения hardcode значений
 */
export const responsiveStyles = {
  padding: {
    page: 'px-4 lg:px-0 py-8 lg:py-12', // Стандартный padding для страниц
    section: 'py-6 lg:py-8', // Для секций внутри страниц
    compact: 'px-4 py-6', // Компактный вариант
  },
  spacing: {
    content: 'space-y-6 lg:space-y-8', // Между контентными блоками
    form: 'space-y-4 lg:space-y-6', // Между элементами форм
    section: 'mt-8 lg:mt-12', // Отступ между секциями
  },
  breakpoints: {
    mobile: 'px-4', // Мобильные устройства
    tablet: 'sm:px-6', // Планшеты
    desktop: 'lg:px-8 xl:px-0', // Десктоп
  },
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
    hero: 'text-lg text-center text-muted-foreground',
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
    'px-6 py-3 text-base bg-primary text-primary-foreground border-0 rounded-md cursor-pointer mr-5 hover:bg-primary/90',
  secondary:
    'px-6 py-3 text-base bg-transparent text-primary border-2 border-primary rounded-md cursor-pointer hover:bg-primary/10',
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
  demoBox: 'bg-primary text-primary-foreground text-sm rounded px-3 py-1',
  demoButton: 'bg-primary text-primary-foreground px-4 py-2 rounded text-sm',
  spacingContainer: 'bg-muted rounded',
} as const;

/**
 * Типы для type-safe использования стилей
 */
export type CardStyleKeys = keyof typeof cardStyles;
export type TextStyleCategories = keyof typeof textStyles;
export type StatusStyleKeys = keyof typeof statusStyles;
export type LayoutStyleKeys = keyof typeof layoutStyles;
export type ResponsiveStyleKeys = keyof typeof responsiveStyles;
export type PageStyleKeys = keyof typeof pageStyles;
export type TableStyleKeys = keyof typeof tableStyles;
export type StoryBookStyleKeys = keyof typeof storyBookStyles;
