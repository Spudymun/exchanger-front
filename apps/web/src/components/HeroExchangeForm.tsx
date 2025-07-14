'use client';

import { Button, ExchangeForm } from '@repo/ui';
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

      {/* Новая архитектура: Compound Components Pattern v2.0 */}
      <ExchangeForm
        exchangeData={form.values}
        isSubmitting={form.isSubmitting}
        isValid={isValid}
        onSubmit={form.handleSubmit}
      >
        <ExchangeForm.Container variant="hero">
          <ExchangeForm.CardPair layout="withArrow">
            <ExchangeForm.FieldWrapper>
              <SendingCard
                form={form}
                t={t}
                exchangeRate={constants.EXCHANGE_RATE}
                minAmount={constants.MIN_AMOUNTS.from}
              />
            </ExchangeForm.FieldWrapper>

            <ExchangeForm.Arrow direction="horizontal" />

            <ExchangeForm.FieldWrapper>
              <ReceivingCard
                form={form}
                banks={banks}
                calculatedAmount={calculatedAmount}
                t={t}
                minAmount={constants.MIN_AMOUNTS.to}
              />
            </ExchangeForm.FieldWrapper>
          </ExchangeForm.CardPair>

          <ExchangeForm.ActionArea variant="simple">
            <Button
              type="submit"
              size="lg"
              disabled={!isValid}
              className="min-w-[200px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {t('exchange')}
            </Button>
          </ExchangeForm.ActionArea>
        </ExchangeForm.Container>
      </ExchangeForm>
    </div>
  );
}
