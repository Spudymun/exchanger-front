/**
 * OrderStatus helper components
 * Extracted from OrderStatus.tsx for better maintainability
 * ИСПРАВЛЕНО: Перемещено в packages/ui согласно архитектуре PROJECT_STRUCTURE_MAP.md
 */

import type { Order } from '@repo/exchange-core';
import {
  textStyles,
  combineStyles,
  Card,
  CardHeader,
  CardContent,
  Button,
  CopyButton,
  statusStyles,
} from '@repo/ui';
import { maskCardNumber } from '@repo/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

// ИСПРАВЛЕНО: Импорт NetworkDisplay из правильного места в packages/ui
import { NetworkDisplay } from '../NetworkDisplay';

const MONO_FONT_CLASS = 'font-mono break-all';

export function OrderPriorityInfo({
  orderData,
  statusConfig,
  t,
}: {
  orderData: Order;
  statusConfig: { label: string; color: 'success' | 'warning' | 'info' | 'destructive' };
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <p className={textStyles.heading.sm}>{t('orderId')}</p>
        <div className="group flex items-center gap-3">
          <p className={textStyles.body.md}>{orderData.id}</p>
          <CopyButton
            value={orderData.id}
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Copy order ID ${orderData.id}`}
          />
        </div>
      </div>
      <div>
        <p className={textStyles.heading.sm}>{t('status')}</p>
        <span
          className={combineStyles(
            'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
            statusStyles[statusConfig.color as keyof typeof statusStyles] || statusStyles.neutral
          )}
        >
          {statusConfig.label}
        </span>
      </div>
    </div>
  );
}

export function OrderMetadataInfo({
  orderData,
  locale,
  t,
}: {
  orderData: Order;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <p className={textStyles.heading.sm}>{t('created')}</p>
        <p className={textStyles.body.md}>{new Date(orderData.createdAt).toLocaleString(locale)}</p>
      </div>
      <div>
        <p className={textStyles.heading.sm}>{t('updated')}</p>
        <p className={textStyles.body.md}>{new Date(orderData.updatedAt).toLocaleString(locale)}</p>
      </div>
    </div>
  );
}

export function OrderCryptoInfo({
  orderData,
  t,
}: {
  orderData: Order;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-4">
      {/* Critical Information - Deposit Address (Hero Section) */}
      <div className="group">
        <p className={combineStyles(textStyles.heading.sm, 'text-warning mb-3')}>
          ⚠️ {t('depositAddress')}
        </p>
        <div className="rounded-lg border-2 border-warning/30 bg-warning/10 p-4 group-hover:bg-warning/15 transition-colors shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p
                className={combineStyles(
                  textStyles.body.md,
                  MONO_FONT_CLASS,
                  'font-semibold text-primary break-all text-base'
                )}
              >
                {orderData.depositAddress}
              </p>
            </div>
            <CopyButton
              value={orderData.depositAddress}
              className="opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0"
              variant="outline"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Email и Blockchain Network на одном уровне */}
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        {/* Email - слева (всегда есть) */}
        <div className="flex-1">
          <p className={textStyles.heading.sm}>{t('email')}</p>
          <p className={textStyles.body.md}>{orderData.email}</p>
        </div>

        {/* Blockchain Network - справа (опционально для USDT) */}
        {orderData.currency === 'USDT' && (
          <div className="flex-1">
            <NetworkDisplay
              tokenStandard={
                (orderData.tokenStandard || 'TRC-20') as 'ERC-20' | 'TRC-20' | 'BEP-20'
              }
              showCopy={true}
              showDetails={true}
              t={t}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderFinancialInfo({
  orderData,
  locale,
  t,
}: {
  orderData: Order;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-4">
      {/* Сумма обмена */}
      <AmountDisplayWithCopy orderData={orderData} locale={locale} t={t} />

      {/* Карта получателя - рядом с суммой (куда поступает фиат) */}
      {orderData.recipientData?.cardNumber && (
        <div>
          <p className={textStyles.heading.sm}>{t('recipientCard')}</p>
          <p className={combineStyles(textStyles.body.md, 'font-mono')}>
            {maskCardNumber(orderData.recipientData.cardNumber)}
          </p>
        </div>
      )}
    </div>
  );
}

export function OrderBasicInfo({
  orderData,
  t,
}: {
  orderData: Order;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      {/* Critical Information - Deposit Address (Hero Section) */}
      <div className="group">
        <p className={combineStyles(textStyles.heading.sm, 'text-warning mb-3')}>
          ⚠️ {t('depositAddress')}
        </p>
        <div className="rounded-lg border-2 border-warning/30 bg-warning/10 p-4 group-hover:bg-warning/15 transition-colors shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p
                className={combineStyles(
                  textStyles.body.md,
                  MONO_FONT_CLASS,
                  'font-semibold text-primary break-all text-base'
                )}
              >
                {orderData.depositAddress}
              </p>
            </div>
            <CopyButton
              value={orderData.depositAddress}
              className="opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0"
              variant="outline"
              size="sm"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function AmountDisplayWithCopy({
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
      <p className={combineStyles(textStyles.heading.sm, 'mb-3')}>{t('amount')}</p>
      <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-4 group-hover:bg-primary/15 transition-colors shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={combineStyles(textStyles.heading.md, MONO_FONT_CLASS, 'text-primary')}>
              {orderData.cryptoAmount} {orderData.currency}
            </span>
            <CopyButton
              value={orderData.cryptoAmount.toString()}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              variant="ghost"
              size="sm"
            />
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <span className="text-primary font-bold">→</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={combineStyles(textStyles.heading.md, 'text-success font-bold')}>
              {orderData.uahAmount.toLocaleString(locale)} ₴
            </span>
            <CopyButton
              value={orderData.uahAmount.toString()}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              variant="ghost"
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TechnicalDetailsCollapsible({
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
            {orderData.txHash ? (
              <div>
                <p className={textStyles.heading.sm}>{t('txHash')}</p>
                <p className={combineStyles(textStyles.body.md, MONO_FONT_CLASS)}>
                  {orderData.txHash}
                </p>
              </div>
            ) : (
              <div>
                <p className={textStyles.body.md}>{t('noTechnicalDetails')}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function OrderAdditionalInfo({
  orderData,
  t,
}: {
  orderData: Order;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      {/* Email */}
      <div>
        <p className={textStyles.heading.sm}>{t('email')}</p>
        <p className={textStyles.body.md}>{orderData.email}</p>
      </div>

      {/* Blockchain Network - для multi-network токенов (USDT) */}
      {orderData.currency === 'USDT' && (
        <div className="bg-accent/5 rounded-lg p-3 border border-accent/10">
          <NetworkDisplay
            tokenStandard={(orderData.tokenStandard || 'TRC-20') as 'ERC-20' | 'TRC-20' | 'BEP-20'}
            showCopy={true}
            showDetails={true}
            t={t}
          />
        </div>
      )}

      {/* Recipient Card */}
      {orderData.recipientData?.cardNumber && (
        <div>
          <p className={textStyles.heading.sm}>{t('recipientCard')}</p>
          <p className={combineStyles(textStyles.body.md, 'font-mono')}>
            {maskCardNumber(orderData.recipientData.cardNumber)}
          </p>
        </div>
      )}
    </>
  );
}
