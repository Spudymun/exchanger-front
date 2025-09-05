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

  return (
    <>
      <OrderStatus
        orderId={orderId}
        showDetails={true}
        collapsibleTechnicalDetails={true}
        useOrderStatusHook={orderStatusHook}
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
