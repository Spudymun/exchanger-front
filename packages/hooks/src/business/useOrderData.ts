import { UI_REFRESH_INTERVALS } from '@repo/constants';
import type { Order } from '@repo/exchange-core';
import React from 'react';

/**
 * Hook параметры для получения данных заказа
 */
export interface UseOrderDataParams {
  refetchInterval?: number;
}

/**
 * Результат хука для получения данных заказа
 */
export interface UseOrderDataResult {
  orderData: Order | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Тип хука для получения данных заказа
 */
export type UseOrderStatusHook = (
  orderId: string,
  options?: UseOrderDataParams
) => {
  data: unknown;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Business Hook для получения данных заказа
 *
 * Отвечает исключительно за data fetching и типизацию данных.
 * Разделение ответственности согласно архитектурным принципам:
 * - Data fetching изолирован от UI логики
 * - Безопасная типизация через type guard
 * - Централизованная обработка ошибок
 */
export function useOrderData(
  orderId: string,
  useOrderStatusHook: UseOrderStatusHook
): UseOrderDataResult {
  const {
    data: orderData,
    isLoading,
    error,
  } = useOrderStatusHook(orderId, {
    refetchInterval: UI_REFRESH_INTERVALS.ORDER_STATUS_REFRESH,
  });

  // Безопасная типизация данных через type guard
  const typedOrderData = React.useMemo(() => {
    return isValidOrder(orderData) ? orderData : undefined;
  }, [orderData]);

  return {
    orderData: typedOrderData,
    isLoading,
    error,
  };
}

/**
 * Type guard для проверки валидности данных Order
 * Заменяет небезопасную type assertion
 */
function isValidOrder(data: unknown): data is Order {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const order = data as Record<string, unknown>;

  return hasRequiredFields(order) && hasValidDates(order);
}

/**
 * Проверка обязательных полей Order
 */
function hasRequiredFields(order: Record<string, unknown>): boolean {
  return (
    typeof order.id === 'string' &&
    typeof order.email === 'string' &&
    typeof order.status === 'string' &&
    typeof order.currency === 'string' &&
    typeof order.depositAddress === 'string' &&
    typeof order.cryptoAmount === 'number' &&
    typeof order.uahAmount === 'number'
  );
}

/**
 * Проверка валидности дат
 */
function hasValidDates(order: Record<string, unknown>): boolean {
  return order.createdAt instanceof Date && order.updatedAt instanceof Date;
}
