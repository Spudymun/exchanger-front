'use client';

import { ORDER_STATUSES, ORDER_STATUS_CONFIG } from '@repo/constants';
import type { Order } from '@repo/exchange-core';
import type { UseOrderStatusHook, StatusConfig } from '@repo/hooks';
import { useOrderData, useOrderStatusConfig } from '@repo/hooks';
import {
  statusStyles,
  textStyles,
  cardStyles,
  combineStyles,
  BaseErrorBoundary,
  getIconComponent,
} from '@repo/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  TechnicalDetailsCollapsible,
  OrderPriorityInfo,
  OrderMetadataInfo,
  OrderCryptoInfo,
  OrderFinancialInfo,
} from './helpers/OrderStatusHelpers';

interface OrderStatusProps {
  orderId: string;
  showDetails?: boolean;
  collapsibleTechnicalDetails?: boolean;
  // ДОБАВЛЕНО: Хук передается как проп для избежания coupling
  useOrderStatusHook: UseOrderStatusHook;
}

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
  // ✅ ИСПРАВЛЕНО: Используем централизованную конфигурацию вместо дублированного STATUS_ICONS
  const config = ORDER_STATUS_CONFIG[orderData.status as keyof typeof ORDER_STATUS_CONFIG];
  const StatusIcon = getIconComponent(config?.icon || 'clock');
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

export function OrderStatus({
  orderId,
  showDetails = false,
  collapsibleTechnicalDetails = false,
  useOrderStatusHook,
}: OrderStatusProps) {
  const t = useTranslations('OrderStatus');

  // Используем новые разделенные хуки
  const { orderData, isLoading, error } = useOrderData(orderId, useOrderStatusHook);
  const { statusConfig } = useOrderStatusConfig(orderData, t);

  if (isLoading) {
    const LoaderIcon = getIconComponent('loader');
    return (
      <div className={combineStyles(cardStyles.base, 'flex items-center justify-center')}>
        <LoaderIcon className="h-6 w-6 animate-spin text-primary" />
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
