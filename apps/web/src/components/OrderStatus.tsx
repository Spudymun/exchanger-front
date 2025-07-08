'use client';

import { ORDER_STATUS_CONFIG, UI_REFRESH_INTERVALS } from '@repo/constants';
import { statusStyles, textStyles, cardStyles, combineStyles } from '@repo/ui';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { useMemo } from 'react';

import { trpc } from '../../lib/trpc';

interface OrderStatusProps {
  orderId: string;
  showDetails?: boolean;
}

interface StatusConfig {
  label: string;
  color: 'success' | 'warning' | 'info' | 'destructive';
  icon: string;
  description: string;
}

interface OrderData {
  id: string;
  status: string;
  cryptoAmount: number;
  uahAmount: number;
  currency: string;
  depositAddress: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  txHash?: string;
}

const STATUS_ICONS = {
  PENDING: Clock,
  PAID: CheckCircle,
  PROCESSING: Loader2,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
} as const;

const getIconColorClass = (color: string): string => {
  const colorMap = {
    success: textStyles.accent.success.split(' ')[0], // Extract color class
    warning: textStyles.accent.warning.split(' ')[0],
    info: textStyles.accent.primary.split(' ')[0],
    destructive: textStyles.accent.error.split(' ')[0],
  } as const;

  return colorMap[color as keyof typeof colorMap] || 'text-gray-600';
};

function OrderStatusHeader({
  orderData,
  statusConfig,
}: {
  orderData: OrderData;
  statusConfig: StatusConfig;
}) {
  const StatusIcon = STATUS_ICONS[orderData.status as keyof typeof STATUS_ICONS] || Clock;
  const isProcessing = orderData.status === 'PROCESSING';

  return (
    <div className="flex items-center space-x-3">
      <StatusIcon
        className={`h-6 w-6 ${getIconColorClass(statusConfig.color)} ${
          isProcessing ? 'animate-spin' : ''
        }`}
      />
      <div>
        <p className={textStyles.heading.md}>{statusConfig.label}</p>
        <p className={textStyles.body.md}>{statusConfig.description}</p>
      </div>
    </div>
  );
}

function OrderStatusDetails({
  orderData,
  statusConfig,
}: {
  orderData: OrderData;
  statusConfig: StatusConfig;
}) {
  return (
    <div className={cardStyles.base}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className={textStyles.heading.sm}>ID заказа</p>
          <p className={textStyles.body.md}>{orderData.id}</p>
        </div>
        <div>
          <p className={textStyles.heading.sm}>Статус</p>
          <span
            className={combineStyles(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              statusStyles[statusConfig.color as keyof typeof statusStyles] || statusStyles.neutral
            )}
          >
            {statusConfig.label}
          </span>
        </div>
        <div>
          <p className={textStyles.heading.sm}>Сумма</p>
          <p className={textStyles.body.md}>
            {orderData.cryptoAmount} {orderData.currency} →{' '}
            {orderData.uahAmount.toLocaleString('ru-RU')} ₴
          </p>
        </div>
        <div>
          <p className={textStyles.heading.sm}>Адрес депозита</p>
          <p className={combineStyles(textStyles.body.md, 'font-mono break-all')}>
            {orderData.depositAddress}
          </p>
        </div>
        <div>
          <p className={textStyles.heading.sm}>Создано</p>
          <p className={textStyles.body.md}>
            {new Date(orderData.createdAt).toLocaleString('ru-RU')}
          </p>
        </div>
        <div>
          <p className={textStyles.heading.sm}>Обновлено</p>
          <p className={textStyles.body.md}>
            {new Date(orderData.updatedAt).toLocaleString('ru-RU')}
          </p>
        </div>
        {orderData.txHash && (
          <div className="sm:col-span-2">
            <p className={textStyles.heading.sm}>Хеш транзакции</p>
            <p className={combineStyles(textStyles.body.md, 'font-mono break-all')}>
              {orderData.txHash}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderStatus({ orderId, showDetails = true }: OrderStatusProps) {
  const {
    data: orderData,
    isLoading,
    error,
  } = trpc.exchange.getOrderStatus.useQuery(
    { orderId },
    {
      enabled: !!orderId,
      refetchInterval: UI_REFRESH_INTERVALS.ORDER_STATUS_REFRESH,
    }
  );

  const statusConfig = useMemo(() => {
    if (!orderData?.status) return null;
    return ORDER_STATUS_CONFIG[orderData.status as keyof typeof ORDER_STATUS_CONFIG];
  }, [orderData?.status]);

  if (isLoading) {
    return (
      <div className={combineStyles(cardStyles.base, 'flex items-center justify-center')}>
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className={combineStyles(textStyles.body.md, 'ml-2')}>Загрузка статуса...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={combineStyles(cardStyles.base, statusStyles.error)}>
        <p className={textStyles.body.md}>Ошибка загрузки статуса: {error.message}</p>
      </div>
    );
  }

  if (!orderData || !statusConfig) {
    return (
      <div className={combineStyles(cardStyles.base, statusStyles.neutral)}>
        <p className={textStyles.body.md}>Заказ не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OrderStatusHeader orderData={orderData} statusConfig={statusConfig} />
      {showDetails && <OrderStatusDetails orderData={orderData} statusConfig={statusConfig} />}
    </div>
  );
}
