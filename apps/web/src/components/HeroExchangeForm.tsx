'use client';

import { calculateUahAmount } from '@repo/exchange-core';
import { useForm } from '@repo/hooks';
import { Button, Input } from '@repo/ui';
import { Calculator, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';

import { useExchangeRates } from '../hooks/useExchangeMutation';

interface HeroExchangeFormProps {
  onExchange?: (amount: number) => void;
  className?: string;
}

interface HeroFormData extends Record<string, unknown> {
  amount: string;
}

// Custom hook for form logic
function useHeroExchangeForm(onExchange?: (amount: number) => void) {
  const form = useForm<HeroFormData>({
    initialValues: {
      amount:
        typeof window !== 'undefined' ? localStorage.getItem('hero-exchange-amount') || '' : '',
    },
    onSubmit: async values => {
      const numericAmount = parseFloat(values.amount);
      if (numericAmount > 0 && onExchange) {
        onExchange(numericAmount);
      }
    },
  });

  // Calculate using existing function
  const calculatedAmount = React.useMemo(() => {
    if (!form.values.amount) return 0;

    const numericAmount = parseFloat(form.values.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return 0;

    try {
      return calculateUahAmount(numericAmount, 'USDT');
    } catch {
      return 0;
    }
  }, [form.values.amount]);

  // localStorage persistence
  useEffect(() => {
    if (typeof window !== 'undefined' && form.values.amount) {
      localStorage.setItem('hero-exchange-amount', form.values.amount);
    }
  }, [form.values.amount]);

  const isValidAmount = Boolean(form.values.amount && parseFloat(form.values.amount) > 0);

  return { form, calculatedAmount, isValidAmount };
}

// Form inputs component
function HeroExchangeInputs({
  form,
  calculatedAmount,
  isLoadingRates,
  t,
}: {
  form: ReturnType<typeof useForm<HeroFormData>>;
  calculatedAmount: number;
  isLoadingRates: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('exchangeCalculator.fromAmount')}
        </label>
        <div className="relative">
          <Input
            type="text"
            value={form.values.amount}
            onChange={e => form.setValue('amount', e.target.value)}
            placeholder="0.00"
            className="pr-16"
            disabled={isLoadingRates}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-sm text-muted-foreground font-mono">USDT</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('exchangeCalculator.toAmount')}</label>
        <div className="relative">
          <Input
            type="text"
            value={calculatedAmount > 0 ? calculatedAmount.toLocaleString() : '0.00'}
            className="pr-16 bg-muted/50"
            readOnly
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-sm text-muted-foreground font-mono">UAH</span>
          </div>
        </div>
      </div>
    </>
  );
}

export function HeroExchangeForm({ onExchange, className }: HeroExchangeFormProps) {
  const t = useTranslations('HomePage');
  const { isLoading: isLoadingRates } = useExchangeRates();
  const { form, calculatedAmount, isValidAmount } = useHeroExchangeForm(onExchange);

  return (
    <div className={`bg-card border rounded-lg p-6 shadow-sm ${className || ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-primary">{t('exchangeCalculator.title')}</h3>
      </div>

      <form onSubmit={form.handleSubmit} className="space-y-3">
        <HeroExchangeInputs
          form={form}
          calculatedAmount={calculatedAmount}
          isLoadingRates={isLoadingRates}
          t={t}
        />

        <Button type="submit" disabled={!isValidAmount || isLoadingRates} className="w-full">
          {isLoadingRates ? t('exchangeCalculator.loading') : t('exchangeCalculator.exchange')}
        </Button>
      </form>
    </div>
  );
}
