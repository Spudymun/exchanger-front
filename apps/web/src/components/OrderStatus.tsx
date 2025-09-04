'use client';

import { ORDER_STATUS_CONFIG, ORDER_STATUSES, UI_REFRESH_INTERVALS } from '@repo/constants';
import type { Order } from '@repo/exchange-core';
import { statusStyles, textStyles, cardStyles, combineStyles, BaseErrorBoundary } from '@repo/ui';
import { getLocalizedStatusLabel, getLocalizedStatusDescription } from '@repo/utils';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useOrderStatus } from '../hooks/useExchangeMutation';

import {
  TechnicalDetailsCollapsible,
  OrderPriorityInfo,
  OrderMetadataInfo,
  OrderCryptoInfo,
  OrderFinancialInfo,
} from './order-status/OrderStatusHelpers';

interface OrderStatusProps {
  orderId: string;
  showDetails?: boolean;
  collapsibleTechnicalDetails?: boolean;
}

interface StatusConfig {
  label: string;
  color: 'success' | 'warning' | 'info' | 'destructive';
  icon: string;
  description: string;
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

  return colorMap[color as keyof typeof colorMap] || 'text-muted-foreground';
};

function OrderStatusHeader({
  orderData,
  statusConfig,
}: {
  orderData: Order;
  statusConfig: StatusConfig;
}) {
  const StatusIcon = STATUS_ICONS[orderData.status as keyof typeof STATUS_ICONS] || Clock;
  const isProcessing = orderData.status === ORDER_STATUSES.PROCESSING;

  return (
    <div className="flex items-center gap-4">
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

const MONO_FONT_CLASS = 'font-mono break-all';

function OrderStatusDetails({
  orderData,
  statusConfig,
  collapsibleTechnicalDetails = false,
  t,
}: {
  orderData: Order;
  statusConfig: StatusConfig;
  collapsibleTechnicalDetails?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const locale = useLocale();
  const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(false);

  return (
    <div className={cardStyles.base}>
      <div className="space-y-6">
        {/* Priority Information Group */}
        <OrderPriorityInfo orderData={orderData} statusConfig={statusConfig} t={t} />

        {/* Crypto & Financial Information Groups - на одном уровне */}
        <div className="border-t pt-6">
          <div className="flex flex-col lg:flex-row lg:gap-8 gap-6">
            {/* Crypto Information Group - адрес + сеть + email */}
            <div className="flex-1">
              <OrderCryptoInfo orderData={orderData} t={t} />
            </div>

            {/* Financial Information Group - сумма + карта получателя */}
            <div className="flex-1 border-t lg:border-t-0 lg:border-l lg:pl-8 pt-6 lg:pt-0">
              <OrderFinancialInfo orderData={orderData} locale={locale} t={t} />
            </div>
          </div>
        </div>

        {/* Metadata Information Group - только даты */}
        <div
          className={`${!collapsibleTechnicalDetails && !orderData.txHash ? 'pt-6' : 'border-t pt-6'}`}
        >
          <OrderMetadataInfo orderData={orderData} locale={locale} t={t} />
        </div>

        {/* Technical details with collapsible functionality */}
        {collapsibleTechnicalDetails && (
          <div className="pt-6">
            <TechnicalDetailsCollapsible
              orderData={orderData}
              isTechnicalExpanded={isTechnicalExpanded}
              setIsTechnicalExpanded={setIsTechnicalExpanded}
              t={t}
            />
          </div>
        )}

        {/* Fallback for non-collapsible mode */}
        {orderData.txHash && !collapsibleTechnicalDetails && (
          <div className="pt-6">
            <div>
              <p className={textStyles.heading.sm}>{t('txHash')}</p>
              <p className={combineStyles(textStyles.body.md, MONO_FONT_CLASS)}>
                {orderData.txHash}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useOrderStatusData(orderId: string, t: ReturnType<typeof useTranslations>) {
  const {
    data: orderData,
    isLoading,
    error,
  } = useOrderStatus(orderId, {
    refetchInterval: UI_REFRESH_INTERVALS.ORDER_STATUS_REFRESH,
  });

  // Type assertion для правильной типизации данных
  const typedOrderData = orderData as Order | undefined;

  const statusConfig = useMemo(() => {
    if (!typedOrderData?.status) return null;

    const originalConfig =
      ORDER_STATUS_CONFIG[typedOrderData.status as keyof typeof ORDER_STATUS_CONFIG];
    if (!originalConfig) return null;

    // Интегрируем локализацию с существующей структурой
    return {
      ...originalConfig,
      label: getLocalizedStatusLabel(typedOrderData.status, t),
      description: getLocalizedStatusDescription(typedOrderData.status, t),
    };
  }, [typedOrderData?.status, t]);

  return { orderData: typedOrderData, isLoading, error, statusConfig };
}

export function OrderStatus({
  orderId,
  showDetails = false,
  collapsibleTechnicalDetails = false,
}: OrderStatusProps) {
  const t = useTranslations('OrderStatus');
  const { orderData, isLoading, error, statusConfig } = useOrderStatusData(orderId, t);

  if (isLoading) {
    return (
      <div className={combineStyles(cardStyles.base, 'flex items-center justify-center')}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className={combineStyles(textStyles.body.md, 'ml-2')}>{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={combineStyles(cardStyles.base, statusStyles.error)}>
        <p className={textStyles.body.md}>{t('error', { error: error.message })}</p>
      </div>
    );
  }

  if (!orderData || !statusConfig) {
    return (
      <div className={combineStyles(cardStyles.base, statusStyles.neutral)}>
        <p className={textStyles.body.md}>{t('notFound')}</p>
      </div>
    );
  }

  return (
    <BaseErrorBoundary componentName="OrderStatus">
      <div className="space-y-4">
        <OrderStatusHeader orderData={orderData} statusConfig={statusConfig} />
        {showDetails && (
          <OrderStatusDetails
            orderData={orderData}
            statusConfig={statusConfig}
            collapsibleTechnicalDetails={collapsibleTechnicalDetails}
            t={t}
          />
        )}
      </div>
    </BaseErrorBoundary>
  );
}
