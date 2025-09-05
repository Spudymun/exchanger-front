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
  responsiveStyles,
  loadingStyles,
  BaseErrorBoundary,
  getIconComponent,
} from '@repo/ui';
import { getStatusColorClass } from '@repo/utils';
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

// ✅ ИСПРАВЛЕНО: Используем централизованную функцию getStatusColorClass
// Извлекаем только цвет текста для иконки (убираем background классы)
const getIconTextColorFromStatus = (status: string): string => {
  const fullClass = getStatusColorClass(status as keyof typeof ORDER_STATUS_CONFIG);
  // Извлекаем только text-* класс из "text-success bg-success/10"
  const textColorMatch = fullClass.match(/text-[\w-]+/);
  return textColorMatch ? textColorMatch[0] : 'text-muted-foreground';
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
    <div className={responsiveStyles.spacing.itemsGap}>
      <StatusIcon
        className={`h-6 w-6 ${getIconTextColorFromStatus(orderData.status)} ${
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
      <div className={responsiveStyles.spacing.content}>
        {/* Priority Information Group */}
        <OrderPriorityInfo orderData={orderData} statusConfig={statusConfig} t={t} />

        {/* Crypto & Financial Information Groups - на одном уровне */}
        <div className={responsiveStyles.spacing.groupDivider}>
          <div className={responsiveStyles.spacing.columnGap}>
            {/* Crypto Information Group - адрес + сеть + email */}
            <div className="flex-1">
              <OrderCryptoInfo orderData={orderData} t={t} />
            </div>

            {/* Financial Information Group - сумма + карта получателя */}
            <div className={responsiveStyles.spacing.sideSection}>
              <OrderFinancialInfo orderData={orderData} locale={locale} t={t} />
            </div>
          </div>
        </div>

        {/* Metadata Information Group - только даты */}
        <div
          className={`${!collapsibleTechnicalDetails && !orderData.txHash ? responsiveStyles.spacing.sectionTop : `border-t ${responsiveStyles.spacing.sectionTop}`}`}
        >
          <OrderMetadataInfo orderData={orderData} locale={locale} t={t} />
        </div>

        {/* Technical details with collapsible functionality */}
        {collapsibleTechnicalDetails && (
          <div className={responsiveStyles.spacing.sectionTop}>
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
          <div className={responsiveStyles.spacing.sectionTop}>
            <div>
              <p className={textStyles.heading.sm}>{t('txHash')}</p>
              <p className={combineStyles(textStyles.body.md, textStyles.utility.monoBreakAll)}>
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
      <div className={combineStyles(cardStyles.base, loadingStyles.inline)}>
        <LoaderIcon className="h-6 w-6 animate-spin text-primary" />
        <span className={combineStyles(textStyles.body.md, loadingStyles.textSpacing)}>
          {t('loading')}
        </span>
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
      <div className={responsiveStyles.spacing.compact}>
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
