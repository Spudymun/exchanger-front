'use client';

import { type Order } from '@repo/exchange-core';
import { useNotifications } from '@repo/hooks/src/client-hooks';
import { OrderStatus, OrderDevTools, type PublicOrderData } from '@repo/ui';
import { useTranslations } from 'next-intl';

import { trpc } from '../../../../lib/trpc-provider';
import { useOrderStatus } from '../../../../src/hooks/useExchangeMutation';

interface OrderPageClientProps {
  orderId: string;
}

export function OrderPageClient({ orderId }: OrderPageClientProps) {
  const utils = trpc.useUtils();
  const notifications = useNotifications();
  const t = useTranslations('OrderPage.OrderStatus');

  // 🆕 Mutation для отмены заказа
  const cancelOrderMutation = trpc.user.orders.cancelOrder.useMutation({
    onSuccess: () => {
      notifications.success(
        t('actions.orderCancelled'),
        t('actions.orderCancelledDescription')
      );
      // Инвалидируем кэш для обновления статуса заказа
      utils.exchange.getOrderStatus.invalidate({ orderId });
    },
    onError: (error: unknown) => {
      notifications.handleApiError(error, t('actions.orderCancelError'));
    },
  });

  // 🆕 TASK: Mutation для отметки заказа как оплаченного
  const markAsPaidMutation = trpc.user.orders.markAsPaid.useMutation({
    onSuccess: () => {
      notifications.success(
        t('actions.orderMarkedPaid'),
        t('actions.orderMarkedPaidDescription')
      );
      // Инвалидируем кэш для обновления статуса заказа
      utils.exchange.getOrderStatus.invalidate({ orderId });
    },
    onError: (error: unknown) => {
      notifications.handleApiError(error, t('actions.orderMarkPaidError'));
    },
  });

  // Получаем данные заказа
  const { data: orderData } = useOrderStatus(orderId, {
    refetchInterval: 30000, // 30 секунд
  });

  // Создаем обертку для хука с правильным типом
  const orderStatusHook = (
    id: string,
    options?: { refetchInterval?: number | ((data: unknown) => number | false) }
  ) => {
    const result = useOrderStatus(id, options);
    return {
      data: result.data as Order | undefined,
      isLoading: result.isLoading,
      error: result.error as Error | null,
    };
  };

  // ✅ НОВЫЕ HANDLERS для действий пользователя
  const handleMarkAsPaid = () => {
    markAsPaidMutation.mutate({ orderId });
  };

  const handleCancelOrder = () => {
    cancelOrderMutation.mutate({ orderId });
  };

  return (
    <>
      <OrderStatus
        orderId={orderId}
        showDetails={true}
        collapsibleTechnicalDetails={true}
        useOrderStatusHook={orderStatusHook}
        onMarkAsPaid={handleMarkAsPaid}
        onCancelOrder={handleCancelOrder}
      />
      <OrderDevTools
        orderId={orderId}
        orderData={orderData as PublicOrderData | undefined}
        trpcUtils={{
          setData: (key: { orderId: string }, updater: (oldData: unknown) => unknown) => {
            // @ts-ignore - временное решение для миграции
            utils.exchange.getOrderStatus.setData(key, updater);
          },
        }}
      />
    </>
  );
}
