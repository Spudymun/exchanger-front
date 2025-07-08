import type { OrderStatus } from '@repo/constants';
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
  email?: string;
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
 * Фильтрует заказы по email
 */
function filterByEmail(orders: Order[], email: string): Order[] {
  return orders.filter(order => order.email.toLowerCase().includes(email.toLowerCase()));
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
 */
export function filterOrders(orders: Order[], filters: OrderFilterOptions = {}): Order[] {
  let filteredOrders = [...orders];

  if (filters.status) {
    filteredOrders = filterByStatus(filteredOrders, filters.status);
  }

  if (filters.email) {
    filteredOrders = filterByEmail(filteredOrders, filters.email);
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
 */
export function processOrders<T = Order>(
  orders: T[],
  options: {
    filters?: OrderFilterOptions;
    sortBy?: OrderSortOption;
    pagination: PaginationOptions;
    getId?: (item: T) => string;
  }
): PaginatedOrdersResult<T> {
  // Применяем фильтрацию только к заказам (Order[])
  let processedOrders = orders;
  if (options.filters && isOrderArray(orders)) {
    processedOrders = filterOrders(orders as Order[], options.filters) as T[];
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

  const completedOrders = orders.filter(order => order.status === 'completed');
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
