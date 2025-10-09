import type { OrderStatus } from '@repo/constants';
import { ORDER_STATUSES } from '@repo/constants';
import type { Order } from '@repo/exchange-core';

/**
 * Опции для сортировки заказов
 */
export type OrderSortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low';

/**
 * Опции фильтрации заказов
 */
export interface OrderFilterOptions {
  status?: OrderStatus;
  searchQuery?: string; // ✅ УНИВЕРСАЛЬНЫЙ ПОИСК: Order ID, суммы, email (через User relation)
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Опции пагинации
 */
export interface PaginationOptions {
  limit: number;
  offset?: number;
  cursor?: string;
}

/**
 * Результат пагинации заказов
 */
export interface PaginatedOrdersResult<T = Order> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Сортирует заказы согласно выбранной опции
 */
export function sortOrders(orders: Order[], sortBy: OrderSortOption = 'newest'): Order[] {
  const sortedOrders = [...orders];

  switch (sortBy) {
    case 'newest':
      return sortedOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    case 'oldest':
      return sortedOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    case 'amount-high':
      return sortedOrders.sort((a, b) => b.uahAmount - a.uahAmount);

    case 'amount-low':
      return sortedOrders.sort((a, b) => a.uahAmount - b.uahAmount);

    default:
      return sortedOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

/**
 * Фильтрует заказы по статусу
 */
function filterByStatus(orders: Order[], status: OrderStatus): Order[] {
  return orders.filter(order => order.status === status);
}

/**
 * Проверяет, совпадает ли дата заказа с поисковым запросом
 * ✅ ВЫНЕСЕНО ДЛЯ СОБЛЮДЕНИЯ ESLint max-statements и complexity
 * Поддерживает форматы: ISO (2025-01-15), локализованные (15.01.2025, 1/15/2025)
 */
function matchesDateQuery(order: Order, searchTerm: string): boolean {
  const date = order.createdAt;
  
  // Компоненты даты в локальном времени
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  
  // Полные форматы даты
  const formats = [
    date.toISOString(), // 2025-01-15T10:30:00.000Z (UTC)
    `${year}-${month}-${day}`, // 2025-01-15 (ISO дата без времени в локальном времени)
    date.toLocaleDateString('ru-RU'), // 15.01.2025
    date.toLocaleDateString('en-US'), // 1/15/2025
    date.toLocaleString('ru-RU'), // 15.01.2025, 10:30:00
  ];
  
  if (formats.some(format => format.toLowerCase().includes(searchTerm))) {
    return true;
  }
  
  // Компоненты даты для точного поиска
  const components = [day, month, year, `${day}.${month}`, `${month}.${year}`, `${day}.${month}.${year}`];
  
  return components.includes(searchTerm);
}

/**
 * Проверяет, совпадает ли заказ с поисковым запросом
 * ✅ ВЫНЕСЕНО ДЛЯ СОБЛЮДЕНИЯ ESLint max-statements (10) и complexity (8)
 */
function matchesSearchQuery(order: Order, searchTerm: string, userEmailCache?: Map<string, string>): boolean {
  // Поиск по Order ID (UUID)
  if (order.id.toLowerCase().includes(searchTerm)) return true;
  
  // Поиск по Public ID
  if (order.publicId?.toLowerCase().includes(searchTerm)) return true;
  
  // Поиск по Crypto Amount
  if (order.cryptoAmount.toString().includes(searchTerm)) return true;
  
  // Поиск по UAH Amount
  if (order.uahAmount.toString().includes(searchTerm)) return true;
  
  // Поиск по дате (несколько форматов)
  if (matchesDateQuery(order, searchTerm)) return true;
  
  // Поиск по Email (только если передан userEmailCache - для OPERATOR/SUPPORT)
  if (userEmailCache) {
    const orderUserEmail = userEmailCache.get(order.userId);
    if (orderUserEmail?.toLowerCase().includes(searchTerm)) return true;
  }
  
  return false;
}

/**
 * Универсальный поиск по заказам: Order ID, Crypto Amount, UAH Amount, Email, Date
 * ✅ СЕНЬЕРСКОЕ РЕШЕНИЕ: один метод для всех типов поиска
 * ✅ ROLE-AGNOSTIC: работает для USER (без email) и OPERATOR/SUPPORT (с email)
 * 
 * @example
 * // USER: поиск по своим заказам (Order ID, суммы, дата)
 * const filtered = filterBySearchQuery(orders, '2025-01-15');
 * 
 * // OPERATOR/SUPPORT: поиск по всем полям включая email
 * const allUsers = await userManager.getAll();
 * const userEmailCache = new Map(allUsers.map(user => [user.id, user.email]));
 * const filtered = filterBySearchQuery(orders, 'john@example.com', userEmailCache);
 */
function filterBySearchQuery(orders: Order[], searchQuery: string, userEmailCache?: Map<string, string>): Order[] {
  if (!searchQuery.trim()) return orders;
  
  const searchTerm = searchQuery.toLowerCase();
  return orders.filter(order => matchesSearchQuery(order, searchTerm, userEmailCache));
}

/**
 * Фильтрует заказы по дате
 */
function filterByDateRange(orders: Order[], fromDate?: Date, toDate?: Date): Order[] {
  let filtered = orders;

  if (fromDate) {
    filtered = filtered.filter(order => order.createdAt >= fromDate);
  }

  if (toDate) {
    filtered = filtered.filter(order => order.createdAt <= toDate);
  }

  return filtered;
}

/**
 * Фильтрует заказы по сумме
 */
function filterByAmountRange(orders: Order[], minAmount?: number, maxAmount?: number): Order[] {
  let filtered = orders;

  if (minAmount !== undefined) {
    filtered = filtered.filter(order => order.uahAmount >= minAmount);
  }

  if (maxAmount !== undefined) {
    filtered = filtered.filter(order => order.uahAmount <= maxAmount);
  }

  return filtered;
}

/**
 * Фильтрует заказы согласно заданным критериям
 * ✅ OVERLOAD 1: Без userEmailCache - поиск по Order ID и суммам (для USER)
 */
export function filterOrders(orders: Order[], filters?: OrderFilterOptions): Order[];
/**
 * Фильтрует заказы согласно заданным критериям  
 * ✅ OVERLOAD 2: С userEmailCache - полный поиск включая email (для OPERATOR/SUPPORT)
 */
export function filterOrders(orders: Order[], filters: OrderFilterOptions, userEmailCache: Map<string, string>): Order[];
export function filterOrders(orders: Order[], filters: OrderFilterOptions = {}, userEmailCache?: Map<string, string>): Order[] {
  let filteredOrders = [...orders];

  if (filters.status) {
    filteredOrders = filterByStatus(filteredOrders, filters.status);
  }

  // ✅ УНИВЕРСАЛЬНЫЙ ПОИСК: Order ID, суммы, email (если есть userEmailCache)
  if (filters.searchQuery) {
    filteredOrders = filterBySearchQuery(filteredOrders, filters.searchQuery, userEmailCache);
  }

  filteredOrders = filterByDateRange(filteredOrders, filters.fromDate, filters.toDate);
  filteredOrders = filterByAmountRange(filteredOrders, filters.minAmount, filters.maxAmount);

  return filteredOrders;
}

/**
 * Вычисляет начальный индекс для пагинации
 */
function calculateStartIndex<T>(
  orders: T[],
  cursor?: string,
  offset = 0,
  getId?: (item: T) => string
): number {
  if (cursor && getId) {
    const cursorIndex = orders.findIndex(order => getId(order) === cursor);
    return cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  return offset;
}

/**
 * Применяет пагинацию к отфильтрованным и отсортированным заказам
 * Поддерживает как offset-based, так и cursor-based пагинацию
 */
export function paginateOrders<T = Order>(
  orders: T[],
  pagination: PaginationOptions,
  getId?: (item: T) => string
): PaginatedOrdersResult<T> {
  const { limit, offset = 0, cursor } = pagination;

  const startIndex = calculateStartIndex(orders, cursor, offset, getId);
  const endIndex = startIndex + limit;
  const items = orders.slice(startIndex, endIndex);

  const hasMore = endIndex < orders.length;
  const lastItem = items.length > 0 ? items[items.length - 1] : undefined;
  const nextCursor = hasMore && getId && lastItem ? getId(lastItem) : undefined;

  return {
    items,
    total: orders.length,
    hasMore,
    nextCursor,
  };
}

/**
 * Комбинированная функция для фильтрации, сортировки и пагинации заказов
 * ✅ OVERLOAD 1: Без userEmailCache - обратная совместимость
 */
export function processOrders<T = Order>(
  orders: T[],
  options: {
    filters?: OrderFilterOptions;
    sortBy?: OrderSortOption;
    pagination: PaginationOptions;
    getId?: (item: T) => string;
  }
): PaginatedOrdersResult<T>;
/**
 * Комбинированная функция для фильтрации, сортировки и пагинации заказов
 * ✅ OVERLOAD 2: С userEmailCache - полная функциональность включая userEmail фильтр
 */
export function processOrders<T = Order>(
  orders: T[],
  options: {
    filters?: OrderFilterOptions;
    sortBy?: OrderSortOption;
    pagination: PaginationOptions;
    getId?: (item: T) => string;
    userEmailCache?: Map<string, string>; // ✅ ДОБАВЛЕНО: поддержка email фильтрации
  }
): PaginatedOrdersResult<T>;
export function processOrders<T = Order>(
  orders: T[],
  options: {
    filters?: OrderFilterOptions;
    sortBy?: OrderSortOption;
    pagination: PaginationOptions;
    getId?: (item: T) => string;
    userEmailCache?: Map<string, string>;
  }
): PaginatedOrdersResult<T> {
  // Применяем фильтрацию только к заказам (Order[])
  let processedOrders = orders;
  if (options.filters && isOrderArray(orders)) {
    // ✅ ВОССТАНОВЛЕНО: передаем userEmailCache для поддержки email фильтрации
    processedOrders = options.userEmailCache 
      ? filterOrders(orders as Order[], options.filters, options.userEmailCache) as T[]
      : filterOrders(orders as Order[], options.filters) as T[];
  }

  // Применяем сортировку только к заказам (Order[])
  if (options.sortBy && isOrderArray(processedOrders)) {
    processedOrders = sortOrders(processedOrders as Order[], options.sortBy) as T[];
  }

  // Применяем пагинацию
  return paginateOrders(processedOrders, options.pagination, options.getId);
}

/**
 * Type guard для проверки, является ли массив массивом заказов
 */
function isOrderArray(items: unknown[]): items is Order[] {
  if (items.length === 0) return true;

  const firstItem = items[0] as Record<string, unknown>;
  return Boolean(
    typeof firstItem?.id === 'string' &&
      typeof firstItem?.status === 'string' &&
      firstItem?.createdAt instanceof Date
  );
}

/**
 * Получает статистику по заказам
 */
export function getOrdersStatistics(orders: Order[]): {
  total: number;
  byStatus: Record<OrderStatus, number>;
  totalVolume: number;
  averageAmount: number;
  today: number;
} {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(order => order.createdAt.toDateString() === today);

  const byStatus = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<OrderStatus, number>
  );

  const completedOrders = orders.filter(order => order.status === ORDER_STATUSES.COMPLETED);
  const totalVolume = completedOrders.reduce((sum, order) => sum + order.uahAmount, 0);
  const averageAmount = completedOrders.length > 0 ? totalVolume / completedOrders.length : 0;

  return {
    total: orders.length,
    byStatus,
    totalVolume,
    averageAmount,
    today: todayOrders.length,
  };
}
