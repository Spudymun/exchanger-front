'use client';

import { type Order } from '@repo/exchange-core';
import { OrderStatus, OrderDevTools, type PublicOrderData } from '@repo/ui';

import { trpc } from '../../../../lib/trpc-provider';
import { useOrderStatus } from '../../../../src/hooks/useExchangeMutation';

interface OrderPageClientProps {
  orderId: string;
}

export function OrderPageClient({ orderId }: OrderPageClientProps) {
  const utils = trpc.useUtils();

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
    // eslint-disable-next-line no-console -- Временный debug для визуального демо
    console.log('User marked order as paid:', orderId);
    // eslint-disable-next-line no-warning-comments -- Заглушка для визуального демо
    // TODO: Implement tRPC mutation для обновления статуса
  };

  const handleCancelOrder = () => {
    // eslint-disable-next-line no-console -- Временный debug для визуального демо
    console.log('User cancelled order:', orderId);
    // eslint-disable-next-line no-warning-comments -- Заглушка для визуального демо
    // TODO: Implement tRPC mutation для отмены заказа
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
