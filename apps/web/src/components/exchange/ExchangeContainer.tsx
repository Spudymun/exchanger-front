'use client';

import { EXCHANGE_DEFAULTS, getDefaultTokenStandard } from '@repo/constants';
import { useFormWithNextIntl } from '@repo/hooks/src/client-hooks';
import { ExchangeForm } from '@repo/ui';
import { securityEnhancedAdvancedExchangeFormSchema } from '@repo/utils';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { ExchangeLayout } from './ExchangeLayout';

interface ExchangeContainerProps {
  locale: string;
  initialParams?: {
    from?: string;
    to?: string;
    bank?: string;
    amount?: number;
  };
}

export function ExchangeContainer({ locale: _locale, initialParams }: ExchangeContainerProps) {
  const tPage = useTranslations('ExchangePage');
  const t = useTranslations('AdvancedExchangeForm');

  const initialFormData = useMemo(() => {
    if (!initialParams) {
      return {
        fromCurrency: EXCHANGE_DEFAULTS.FROM_CURRENCY,
        tokenStandard: getDefaultTokenStandard(EXCHANGE_DEFAULTS.FROM_CURRENCY) || 'TRC-20',
        toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
        selectedBank: 'privatbank',
        cryptoAmount: '',
        email: '',
        cardNumber: '',
        captchaAnswer: '',
        agreeToTerms: false,
      };
    }

    const fromCurrency = initialParams.from?.split('-')[0] || EXCHANGE_DEFAULTS.FROM_CURRENCY;
    return {
      fromCurrency,
      tokenStandard: getDefaultTokenStandard(fromCurrency) || 'TRC-20',
      toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
      selectedBank: initialParams.bank || 'privatbank',
      cryptoAmount: initialParams.amount?.toString() || '',
      email: '',
      cardNumber: '',
      captchaAnswer: '',
      agreeToTerms: false,
    };
  }, [initialParams]);

  const form = useFormWithNextIntl<Record<string, unknown>>({
    initialValues: initialFormData,
    validationSchema: securityEnhancedAdvancedExchangeFormSchema,
    t,
    onSubmit: async (_values: Record<string, unknown>) => {
      // Form submission logic будет в task 2.4
      throw new Error('Form submission not yet implemented');
    },
  });

  // Автоматический расчет как в HeroExchangeForm через useMemo
  const calculatedAmount = useMemo(() => {
    const amount = Number(form.values.cryptoAmount);
    const MOCK_UAH_RATE = 35.5;
    return amount > 0 ? amount * MOCK_UAH_RATE : 0;
  }, [form.values.cryptoAmount]);

  return (
    <ExchangeForm.Container variant="full" className="exchange-container">
      {/* Page Header */}
      <header className="exchange-header mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground lg:text-4xl">{tPage('title')}</h1>
        <p className="mt-2 text-muted-foreground lg:text-lg">{tPage('description')}</p>
      </header>

      {/* Main Exchange Layout */}
      <ExchangeLayout 
        form={form} 
        t={t} 
        calculatedAmount={calculatedAmount}
      />
    </ExchangeForm.Container>
  );
}
