/**
 * OrderStatus helper components
 * Extracted from OrderStatus.tsx for better maintainability
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
} from '@repo/ui';
import { maskCardNumber } from '@repo/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { NetworkDisplay } from '../order/NetworkDisplay';

const MONO_FONT_CLASS = 'font-mono break-all';

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
      <p className={textStyles.heading.sm}>{t('amount')}</p>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 group-hover:bg-primary/10 transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={combineStyles(textStyles.heading.md, MONO_FONT_CLASS, 'text-primary')}>
              {orderData.cryptoAmount} {orderData.currency}
            </span>
            <CopyButton
              value={`${orderData.cryptoAmount} ${orderData.currency}`}
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
