import { type OrderStatus, ORDER_STATUSES, BUSINESS_LIMITS } from '@repo/constants';
import React from 'react';

import { useNotifications, type UseNotificationsReturn } from '../useNotifications';

interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  amount: number;
  currency: string;
  direction: string;
  userEmail: string;
}

const STATUS_CHANGE_MESSAGE = 'Статус заявки изменен';

/**
 * Order Tracking Hook
 *
 * Real-time order status tracking with notifications
 */
export function useOrderTracking(orderId?: string) {
  const notifications = useNotifications();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Simulate order tracking since we don't have real API yet
  React.useEffect(() => {
    if (!orderId) return;

    return simulateOrderTracking(orderId, setOrder, setIsLoading, setError);
  }, [orderId]);

  // Notify on status changes
  useOrderStatusNotifications(order, notifications);

  return {
    order,
    isLoading,
    error,
    isActive:
      order &&
      [ORDER_STATUSES.PENDING, ORDER_STATUSES.PAID, ORDER_STATUSES.PROCESSING].includes(
        order.status as typeof ORDER_STATUSES.PENDING
      ),
    isCompleted: order?.status === ORDER_STATUSES.COMPLETED,
    isFailed: order?.status === ORDER_STATUSES.CANCELLED, // Используем централизованный статус вместо хардкод 'failed'
  };
}

// Separate simulation function to reduce main function size
function simulateOrderTracking(
  orderId: string,
  setOrder: React.Dispatch<React.SetStateAction<Order | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): () => void {
  setIsLoading(true);
  setError(null);

  const timerId = setTimeout(() => {
    const mockOrder: Order = {
      id: orderId,
      status: ORDER_STATUSES.PROCESSING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      amount: BUSINESS_LIMITS.TEST_ORDER_AMOUNT,
      currency: 'BTC',
      direction: 'crypto-to-uah',
      userEmail: 'user@example.com',
    };

    setOrder(mockOrder);
    setIsLoading(false);
  }, BUSINESS_LIMITS.SIMULATION_UPDATE_INTERVAL_MS);

  // Возвращаем cleanup функцию
  return () => {
    clearTimeout(timerId);
    setIsLoading(false);
  };
}

// Separate notification hook to reduce complexity
function useOrderStatusNotifications(order: Order | null, notifications: UseNotificationsReturn) {
  const prevStatus = React.useRef(order?.status);

  React.useEffect(() => {
    if (!order || !prevStatus.current || prevStatus.current === order.status) {
      return;
    }

    const statusMessages: Record<OrderStatus, string> = {
      [ORDER_STATUSES.PENDING]: 'Заявка ожидает оплаты',
      [ORDER_STATUSES.PAID]: 'Заявка оплачена',
      [ORDER_STATUSES.PROCESSING]: 'Заявка поступила в обработку',
      [ORDER_STATUSES.COMPLETED]: 'Заявка успешно выполнена!',
      [ORDER_STATUSES.CANCELLED]: 'Заявка была отменена',
      [ORDER_STATUSES.FAILED]: 'Заявка завершилась неудачно',
    };

    const message = statusMessages[order.status as OrderStatus];

    if (message) {
      notifyStatusChange(order.status, message, notifications);
    }

    prevStatus.current = order.status;
  }, [order, notifications]);
}

// Helper function to handle notifications
function notifyStatusChange(
  status: string,
  message: string,
  notifications: UseNotificationsReturn
) {
  switch (status) {
    case ORDER_STATUSES.COMPLETED:
      notifications.success(STATUS_CHANGE_MESSAGE, message);
      break;
    case ORDER_STATUSES.CANCELLED:
    case ORDER_STATUSES.FAILED:
      notifications.error(STATUS_CHANGE_MESSAGE, message);
      break;
    default:
      notifications.info(STATUS_CHANGE_MESSAGE, message);
      break;
  }
}
