'use client';

import { ORDER_STATUS_CONFIG, ORDER_STATUSES, UI_REFRESH_INTERVALS } from '@repo/constants';
import type { Order } from '@repo/exchange-core';
import {
  statusStyles,
  textStyles,
  cardStyles,
  combineStyles,
  BaseErrorBoundary,
  Card,
  CardHeader,
  CardContent,
  Button,
  CopyButton,
} from '@repo/ui';
import { getLocalizedStatusLabel, getLocalizedStatusDescription } from '@repo/utils';
import { CheckCircle, Clock, Loader2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useOrderStatus } from '../hooks/useExchangeMutation';

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

const MONO_FONT_CLASS = 'font-mono break-all';

function AmountDisplayWithCopy({
  orderData,
  locale,
  t,
}: {
  orderData: Order;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="group">
      <p className={textStyles.heading.sm}>{t('amount')}</p>
      <div className="flex items-center justify-between gap-2 rounded-lg p-2 group-hover:bg-accent/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={combineStyles(
                textStyles.body.md,
                MONO_FONT_CLASS,
                'font-semibold text-primary'
              )}
            >
              {orderData.cryptoAmount} {orderData.currency}
            </span>
            <CopyButton
              value={`${orderData.cryptoAmount} ${orderData.currency}`}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              variant="ghost"
              size="sm"
            />
          </div>
          <span className={textStyles.body.md}>→</span>
          <span className={combineStyles(textStyles.body.md, 'font-semibold')}>
            {orderData.uahAmount.toLocaleString(locale)} ₴
          </span>
        </div>
      </div>
    </div>
  );
}

function TechnicalDetailsCollapsible({
  orderData,
  isTechnicalExpanded,
  setIsTechnicalExpanded,
  t,
}: {
  orderData: Order;
  isTechnicalExpanded: boolean;
  setIsTechnicalExpanded: (expanded: boolean) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="sm:col-span-2">
      <Card>
        <CardHeader className="pb-2">
          <Button
            variant="ghost"
            onClick={() => setIsTechnicalExpanded(!isTechnicalExpanded)}
            className="flex items-center justify-between w-full h-auto p-0 text-left"
          >
            <span className={textStyles.heading.sm}>{t('technicalDetails')}</span>
            {isTechnicalExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        {isTechnicalExpanded && (
          <CardContent className="pt-0">
            <div>
              <p className={textStyles.heading.sm}>{t('txHash')}</p>
              <p className={combineStyles(textStyles.body.md, MONO_FONT_CLASS)}>
                {orderData.txHash}
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function OrderBasicInfo({
  orderData,
  statusConfig,
  locale,
  t,
}: {
  orderData: Order;
  statusConfig: StatusConfig;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <div>
        <p className={textStyles.heading.sm}>{t('orderId')}</p>
        <p className={textStyles.body.md}>{orderData.id}</p>
      </div>
      <div>
        <p className={textStyles.heading.sm}>{t('status')}</p>
        <span
          className={combineStyles(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            statusStyles[statusConfig.color as keyof typeof statusStyles] || statusStyles.neutral
          )}
        >
          {statusConfig.label}
        </span>
      </div>
      <AmountDisplayWithCopy orderData={orderData} locale={locale} t={t} />
      <div className="group">
        <p className={textStyles.heading.sm}>{t('depositAddress')}</p>
        <div className="flex items-center justify-between gap-2 rounded-lg p-2 group-hover:bg-accent/5 transition-colors">
          <p
            className={combineStyles(
              textStyles.body.md,
              MONO_FONT_CLASS,
              'font-semibold text-primary break-all'
            )}
          >
            {orderData.depositAddress}
          </p>
          <CopyButton
            value={orderData.depositAddress}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            variant="ghost"
            size="sm"
          />
        </div>
      </div>
      <div>
        <p className={textStyles.heading.sm}>{t('created')}</p>
        <p className={textStyles.body.md}>{new Date(orderData.createdAt).toLocaleString(locale)}</p>
      </div>
      <div>
        <p className={textStyles.heading.sm}>{t('updated')}</p>
        <p className={textStyles.body.md}>{new Date(orderData.updatedAt).toLocaleString(locale)}</p>
      </div>
    </>
  );
}

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
  const locale = useLocale(); // ✅ Локаль для форматирования дат и чисел
  const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(false);

  return (
    <div className={cardStyles.base}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OrderBasicInfo orderData={orderData} statusConfig={statusConfig} locale={locale} t={t} />

        {/* Technical details with collapsible functionality */}
        {orderData.txHash && collapsibleTechnicalDetails && (
          <TechnicalDetailsCollapsible
            orderData={orderData}
            isTechnicalExpanded={isTechnicalExpanded}
            setIsTechnicalExpanded={setIsTechnicalExpanded}
            t={t}
          />
        )}

        {/* Fallback for non-collapsible mode */}
        {orderData.txHash && !collapsibleTechnicalDetails && (
          <div className="sm:col-span-2">
            <p className={textStyles.heading.sm}>{t('txHash')}</p>
            <p className={combineStyles(textStyles.body.md, MONO_FONT_CLASS)}>{orderData.txHash}</p>
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
