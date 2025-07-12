'use client';

import { Button } from '@repo/ui';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

import { ExchangeArrow } from './exchange-form/ExchangeArrow';
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

      {/* Улучшенная дизайн-система v2.1 - четкое разделение для обеих тем */}
      <div className="bg-card backdrop-blur-sm text-card-foreground border border-border/80 dark:border-border/80 rounded-xl shadow-md shadow-black/8 dark:shadow-black/30 p-6">
        <form onSubmit={form.handleSubmit} className="space-y-6">
          {/* Компактная версия с вынесенной стрелкой */}
          <div className="flex flex-row gap-4 items-center">
            <div className="flex-1 min-w-0">
              <SendingCard
                form={form}
                t={t}
                exchangeRate={constants.EXCHANGE_RATE}
                minAmount={constants.MIN_AMOUNTS.from}
              />
            </div>

            <ExchangeArrow />

            <div className="flex-1 min-w-0">
              <ReceivingCard
                form={form}
                banks={banks}
                calculatedAmount={calculatedAmount}
                t={t}
                minAmount={constants.MIN_AMOUNTS.to}
              />
            </div>
          </div>

          {/* Кнопка exchange - семантически правильное размещение */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={!isValid}
              className="min-w-[200px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {t('exchange')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
