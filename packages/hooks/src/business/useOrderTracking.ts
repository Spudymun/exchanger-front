import React from 'react';

import { useNotificationStore, type NotificationStore } from '../state/notification-store.js';

interface Order {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
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
  const notifications = useNotificationStore();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Simulate order tracking since we don't have real API yet
  React.useEffect(() => {
    if (!orderId) return;

    simulateOrderTracking(orderId, setOrder, setIsLoading, setError);
  }, [orderId]);

  // Notify on status changes
  useOrderStatusNotifications(order, notifications);

  return {
    order,
    isLoading,
    error,
    isActive: order && ['pending', 'processing'].includes(order.status),
    isCompleted: order?.status === 'completed',
    isFailed: order?.status === 'failed',
  };
}

// Separate simulation function to reduce main function size
function simulateOrderTracking(
  orderId: string,
  setOrder: React.Dispatch<React.SetStateAction<Order | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) {
  setIsLoading(true);
  setError(null);

  setTimeout(() => {
    const mockOrder: Order = {
      id: orderId,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      amount: 1000,
      currency: 'BTC',
      direction: 'crypto-to-uah',
      userEmail: 'user@example.com',
    };

    setOrder(mockOrder);
    setIsLoading(false);
  }, 1000);
}

// Separate notification hook to reduce complexity
function useOrderStatusNotifications(order: Order | null, notifications: NotificationStore) {
  const prevStatus = React.useRef(order?.status);

  React.useEffect(() => {
    if (!order || !prevStatus.current || prevStatus.current === order.status) {
      return;
    }

    const statusMessages = {
      processing: 'Заявка поступила в обработку',
      completed: 'Заявка успешно выполнена!',
      failed: 'Произошла ошибка при выполнении заявки',
      cancelled: 'Заявка была отменена',
    };

    const message = statusMessages[order.status as keyof typeof statusMessages];

    if (message) {
      notifyStatusChange(order.status, message, notifications);
    }

    prevStatus.current = order.status;
  }, [order, notifications]);
}

// Helper function to handle notifications
function notifyStatusChange(status: string, message: string, notifications: NotificationStore) {
  switch (status) {
    case 'completed':
      notifications.success(STATUS_CHANGE_MESSAGE, message);
      break;
    case 'failed':
      notifications.error(STATUS_CHANGE_MESSAGE, message);
      break;
    default:
      notifications.info(STATUS_CHANGE_MESSAGE, message);
      break;
  }
}
