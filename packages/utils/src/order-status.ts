import type { OrderStatus } from '@repo/constants';
import type { Order } from '@repo/exchange-core';

/**
 * Хелперы для работы со статусами заказов
 * Централизованная логика проверки и валидации статусов
 */

/**
 * Проверяет, является ли заказ активным (требует обработки)
 */
export function isActiveOrder(order: Order): boolean {
  return order.status === 'pending' || order.status === 'processing';
}

/**
 * Проверяет, завершен ли заказ
 */
export function isCompletedOrder(order: Order): boolean {
  return order.status === 'completed';
}

/**
 * Проверяет, отменен ли заказ
 */
export function isCancelledOrder(order: Order): boolean {
  return order.status === 'cancelled';
}

/**
 * Проверяет, находится ли заказ в финальном состоянии
 */
export function isFinalStatus(order: Order): boolean {
  return isCompletedOrder(order) || isCancelledOrder(order);
}

/**
 * Проверяет, можно ли изменить статус заказа
 */
export function canChangeOrderStatus(order: Order): boolean {
  return !isFinalStatus(order);
}

/**
 * Проверяет, возможен ли переход между статусами
 */
export function canTransitionStatus(fromStatus: OrderStatus, toStatus: OrderStatus): boolean {
  switch (fromStatus) {
    case 'pending':
      return ['processing', 'cancelled'].includes(toStatus);
    case 'processing':
      return ['completed', 'cancelled'].includes(toStatus);
    case 'paid':
      return ['processing'].includes(toStatus);
    case 'completed':
    case 'cancelled':
      return false;
    default:
      return false;
  }
}

/**
 * Возвращает возможные статусы для перехода
 */
export function getAvailableTransitions(currentStatus: OrderStatus): OrderStatus[] {
  switch (currentStatus) {
    case 'pending':
      return ['processing', 'cancelled'];
    case 'processing':
      return ['completed', 'cancelled'];
    case 'paid':
      return ['processing'];
    case 'completed':
    case 'cancelled':
      return [];
    default:
      return [];
  }
}

/**
 * Проверяет, требует ли статус дополнительных данных
 */
export function requiresAdditionalData(status: OrderStatus): boolean {
  // Например, для completed может требоваться txHash
  return status === 'completed';
}

/**
 * Фильтры для заказов по статусам
 */

/**
 * Фильтрует заказы, требующие обработки оператором
 */
export function filterOrdersForOperator(orders: Order[]): Order[] {
  return orders.filter(isActiveOrder);
}

/**
 * Фильтрует завершенные заказы
 */
export function filterCompletedOrders(orders: Order[]): Order[] {
  return orders.filter(isCompletedOrder);
}

/**
 * Фильтрует отмененные заказы
 */
export function filterCancelledOrders(orders: Order[]): Order[] {
  return orders.filter(isCancelledOrder);
}

/**
 * Фильтрует заказы по конкретному статусу
 */
export function filterOrdersByStatus(orders: Order[], status: OrderStatus): Order[] {
  return orders.filter(order => order.status === status);
}

/**
 * Группирует заказы по статусам
 */
export function groupOrdersByStatus(orders: Order[]): Record<OrderStatus, Order[]> {
  return orders.reduce(
    (groups, order) => {
      if (!groups[order.status]) {
        groups[order.status] = [];
      }
      groups[order.status].push(order);
      return groups;
    },
    {} as Record<OrderStatus, Order[]>
  );
}

/**
 * Подсчитывает заказы по статусам
 */
export function countOrdersByStatus(orders: Order[]): Record<OrderStatus, number> {
  return orders.reduce(
    (counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
      return counts;
    },
    {} as Record<OrderStatus, number>
  );
}

/**
 * Валидация статусов
 */

/**
 * Валидирует переход статуса с дополнительной логикой
 */
export function validateStatusTransition(
  order: Order,
  newStatus: OrderStatus,
  additionalData?: Record<string, unknown>
): { isValid: boolean; error?: string } {
  // Проверка возможности перехода
  if (!canTransitionStatus(order.status, newStatus)) {
    return {
      isValid: false,
      error: `Невозможно изменить статус с ${order.status} на ${newStatus}`,
    };
  }

  // Проверка дополнительных данных
  if (requiresAdditionalData(newStatus) && newStatus === 'completed' && !additionalData?.txHash) {
    return {
      isValid: false,
      error: 'Для завершения заказа требуется хеш транзакции',
    };
  }

  return { isValid: true };
}

/**
 * Утилиты для UI
 */

/**
 * Возвращает человекочитаемое описание статуса
 */
export function getStatusDisplayName(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Ожидает обработки';
    case 'processing':
      return 'В обработке';
    case 'completed':
      return 'Завершен';
    case 'cancelled':
      return 'Отменен';
    case 'paid':
      return 'Оплачен';
    default:
      return status;
  }
}

/**
 * Возвращает CSS класс для статуса (для UI)
 */
export function getStatusColorClass(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'processing':
      return 'text-blue-600 bg-blue-50';
    case 'completed':
      return 'text-green-600 bg-green-50';
    case 'cancelled':
      return 'text-red-600 bg-red-50';
    case 'paid':
      return 'text-purple-600 bg-purple-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
