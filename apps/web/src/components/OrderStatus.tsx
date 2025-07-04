'use client';

import { EXCHANGE_ORDER_STATUS_CONFIG } from '@repo/constants';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { useMemo } from 'react';

import { trpc } from '../../lib/trpc';

// Константы для компонента
const ORDER_STATUS_REFRESH_INTERVAL = 30000; // 30 секунд

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

const getStatusColorClass = (color: string): string => {
  switch (color) {
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50';
    case 'info':
      return 'text-blue-600 bg-blue-50';
    case 'destructive':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getIconColorClass = (color: string): string => {
  switch (color) {
    case 'success':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'info':
      return 'text-blue-600';
    case 'destructive':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
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
        <p className="text-lg font-semibold text-gray-900">{statusConfig.label}</p>
        <p className="text-sm text-gray-600">{statusConfig.description}</p>
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-gray-900">ID заказа</p>
          <p className="text-sm text-gray-600">{orderData.id}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Статус</p>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColorClass(statusConfig.color)}`}
          >
            {statusConfig.label}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Сумма</p>
          <p className="text-sm text-gray-600">
            {orderData.cryptoAmount} {orderData.currency} →{' '}
            {orderData.uahAmount.toLocaleString('ru-RU')} ₴
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Адрес депозита</p>
          <p className="text-sm text-gray-600 font-mono break-all">{orderData.depositAddress}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Создано</p>
          <p className="text-sm text-gray-600">
            {new Date(orderData.createdAt).toLocaleString('ru-RU')}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Обновлено</p>
          <p className="text-sm text-gray-600">
            {new Date(orderData.updatedAt).toLocaleString('ru-RU')}
          </p>
        </div>
        {orderData.txHash && (
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-gray-900">Хеш транзакции</p>
            <p className="text-sm text-gray-600 font-mono break-all">{orderData.txHash}</p>
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
      refetchInterval: ORDER_STATUS_REFRESH_INTERVAL,
    }
  );

  const statusConfig = useMemo(() => {
    if (!orderData?.status) return null;
    return EXCHANGE_ORDER_STATUS_CONFIG[
      orderData.status as keyof typeof EXCHANGE_ORDER_STATUS_CONFIG
    ];
  }, [orderData?.status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-600">Загрузка статуса...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm text-red-600">Ошибка загрузки статуса: {error.message}</p>
      </div>
    );
  }

  if (!orderData || !statusConfig) {
    return (
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">Заказ не найден</p>
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
