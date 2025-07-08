import type { OrderStatus } from '@repo/constants';
import { ORDER_STATUSES } from '@repo/constants';
import type { Order } from '@repo/exchange-core';

/**
 * Хелперы для работы со статусами заказов
 * Централизованная логика проверки и валидации статусов
 */

/**
 * Проверяет, является ли заказ активным (требует обработки)
 */
export function isActiveOrder(order: Order): boolean {
  return order.status === ORDER_STATUSES.PENDING || order.status === ORDER_STATUSES.PROCESSING;
}

/**
 * Проверяет, завершен ли заказ
 */
export function isCompletedOrder(order: Order): boolean {
  return order.status === ORDER_STATUSES.COMPLETED;
}

/**
 * Проверяет, отменен ли заказ
 */
export function isCancelledOrder(order: Order): boolean {
  return order.status === ORDER_STATUSES.CANCELLED;
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
    case ORDER_STATUSES.PENDING:
      return ([ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED] as OrderStatus[]).includes(
        toStatus
      );
    case ORDER_STATUSES.PROCESSING:
      return ([ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED] as OrderStatus[]).includes(
        toStatus
      );
    case ORDER_STATUSES.PAID:
      return ([ORDER_STATUSES.PROCESSING] as OrderStatus[]).includes(toStatus);
    case ORDER_STATUSES.COMPLETED:
    case ORDER_STATUSES.CANCELLED:
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
    case ORDER_STATUSES.PENDING:
      return [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED];
    case ORDER_STATUSES.PROCESSING:
      return [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED];
    case ORDER_STATUSES.PAID:
      return [ORDER_STATUSES.PROCESSING];
    case ORDER_STATUSES.COMPLETED:
    case ORDER_STATUSES.CANCELLED:
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
    case ORDER_STATUSES.PENDING:
      return 'Ожидает обработки';
    case ORDER_STATUSES.PROCESSING:
      return 'В обработке';
    case ORDER_STATUSES.COMPLETED:
      return 'Завершен';
    case ORDER_STATUSES.CANCELLED:
      return 'Отменен';
    case ORDER_STATUSES.PAID:
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
    case ORDER_STATUSES.PENDING:
      return 'text-yellow-600 bg-yellow-50';
    case ORDER_STATUSES.PROCESSING:
      return 'text-blue-600 bg-blue-50';
    case ORDER_STATUSES.COMPLETED:
      return 'text-green-600 bg-green-50';
    case ORDER_STATUSES.CANCELLED:
      return 'text-red-600 bg-red-50';
    case ORDER_STATUSES.PAID:
      return 'text-purple-600 bg-purple-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
