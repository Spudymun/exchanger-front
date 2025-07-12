'use client';

import { Button } from '@repo/ui';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

import { ExchangeBenefits } from './exchange-form/ExchangeBenefits';
import { ReceivingCard } from './exchange-form/ReceivingCard';
import { SendingCard } from './exchange-form/SendingCard';
import { useHeroExchangeForm } from './exchange-form/useHeroExchangeForm';

export interface HeroExchangeFormData extends Record<string, unknown> {
  fromAmount: string;
  fromCurrency: string;
  tokenStandard?: string;
  toCurrency: string;
  selectedBankId: string;
}

interface HeroExchangeFormProps {
  onExchange?: (data: HeroExchangeFormData) => void;
  className?: string;
}

export function HeroExchangeForm({ onExchange, className }: HeroExchangeFormProps) {
  const t = useTranslations('AdvancedExchangeForm');
  const { form, calculatedAmount, banks, isValid, constants } = useHeroExchangeForm(t, onExchange);

  return (
    <div className={className}>
      <ExchangeBenefits t={t} />
      <form onSubmit={form.handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SendingCard
            form={form}
            t={t}
            exchangeRate={constants.EXCHANGE_RATE}
            minAmount={constants.MIN_AMOUNTS.from}
          />
          <ReceivingCard
            form={form}
            banks={banks}
            calculatedAmount={calculatedAmount}
            t={t}
            minAmount={constants.MIN_AMOUNTS.to}
          />
        </div>
        <div className="flex justify-center">
          <Button type="submit" size="lg" disabled={!isValid} className="min-w-[200px]">
            <ArrowRight className="w-4 h-4 mr-2" />
            {t('exchange')}
          </Button>
        </div>
      </form>
    </div>
  );
}
