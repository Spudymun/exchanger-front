import type { OrderStatus } from '@repo/constants';
import { ORDER_STATUSES, ORDER_STATUS_GROUPS, ORDER_STATUS_CONFIG } from '@repo/constants';
import type { Order } from '@repo/exchange-core';
import type { useTranslations } from 'next-intl';

// server-i18n-errors.ts removed - use getTranslations from next-intl/server in apps/web

type TFunction = ReturnType<typeof useTranslations>;

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
  return status === ORDER_STATUSES.COMPLETED;
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
 * Supports localization via optional locale parameter
 */
export function validateStatusTransition(
  order: Order,
  newStatus: OrderStatus,
  additionalData?: Record<string, unknown>
): { isValid: boolean; error?: string } {
  // Проверка возможности перехода
  if (!canTransitionStatus(order.status, newStatus)) {
    const error = `Cannot change status from ${order.status} to ${newStatus}`;

    return {
      isValid: false,
      error,
    };
  }

  // Проверка дополнительных данных
  if (
    requiresAdditionalData(newStatus) &&
    newStatus === ORDER_STATUSES.COMPLETED &&
    !additionalData?.txHash
  ) {
    const error = 'Transaction hash required to complete order';

    return {
      isValid: false,
      error,
    };
  }

  return { isValid: true };
}

/**
 * Утилиты для UI
 */

/**
 * Возвращает человекочитаемое описание статуса
 * Использует централизованную конфигурацию ORDER_STATUS_CONFIG (Rule 20)
 */
export function getStatusDisplayName(status: OrderStatus): string {
  const config = ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG];
  return config ? config.label : status;
}

/**
 * Возвращает CSS класс для статуса (для UI)
 * Использует централизованную конфигурацию ORDER_STATUS_CONFIG (Rule 20)
 */
export function getStatusColorClass(status: OrderStatus): string {
  const config = ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG];
  if (!config) {
    return 'text-muted-foreground bg-muted/50';
  }

  switch (config.color) {
    case 'success':
      return 'text-success bg-success/10';
    case 'warning':
      return 'text-warning bg-warning/10';
    case 'info':
      return 'text-info bg-info/10';
    case 'destructive':
      return 'text-destructive bg-destructive/10';
    default:
      return 'text-muted-foreground bg-muted/50';
  }
}

/**
 * Утилитарные функции для работы со статусами - перемещены из constants (Rule 20)
 * Constants должен содержать только константы, не бизнес-логику
 */

/**
 * Проверяет, является ли статус активным (требует обработки)
 */
export function isActiveOrderStatus(status: OrderStatus): boolean {
  return (ORDER_STATUS_GROUPS.ACTIVE as readonly OrderStatus[]).includes(status);
}

/**
 * Проверяет, является ли статус финальным
 */
export function isFinalOrderStatus(status: OrderStatus): boolean {
  return (ORDER_STATUS_GROUPS.FINAL as readonly OrderStatus[]).includes(status);
}

/**
 * Проверяет, является ли статус успешным
 */
export function isSuccessfulOrderStatus(status: OrderStatus): boolean {
  return (ORDER_STATUS_GROUPS.COMPLETED as readonly OrderStatus[]).includes(status);
}

/**
 * Проверяет, является ли статус неудачным
 */
export function isFailedOrderStatus(status: OrderStatus): boolean {
  return (ORDER_STATUS_GROUPS.FAILED as readonly OrderStatus[]).includes(status);
}

/**
 * Получить локализованное название статуса
 * Интегрируется с существующей системой next-intl
 */
export function getLocalizedStatusLabel(status: OrderStatus, t: TFunction): string {
  const statusKey = `statuses.${status}` as const;
  return t(statusKey);
}

/**
 * Получить локализованное описание статуса
 * Интегрируется с существующей системой next-intl
 */
export function getLocalizedStatusDescription(status: OrderStatus, t: TFunction): string {
  const descriptionKey = `descriptions.${status}` as const;
  return t(descriptionKey);
}
