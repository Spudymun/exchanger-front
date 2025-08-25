'use client';

import { EXCHANGE_DEFAULTS, getDefaultTokenStandard, type CryptoCurrency } from '@repo/constants';
import { calculateUahAmount } from '@repo/exchange-core';
import { useFormWithNextIntl } from '@repo/hooks/src/client-hooks';
import { ExchangeForm } from '@repo/ui';
import { securityEnhancedUnifiedExchangeFormSchema } from '@repo/utils';
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

// ✅ Хук для инициализации формы
function useExchangeFormData(initialParams?: ExchangeContainerProps['initialParams']) {
  return useMemo(() => {
    if (!initialParams) {
      return {
        fromCurrency: EXCHANGE_DEFAULTS.FROM_CURRENCY,
        tokenStandard: getDefaultTokenStandard(EXCHANGE_DEFAULTS.FROM_CURRENCY) || 'TRC-20',
        toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
        selectedBankId: 'privatbank',
        fromAmount: '',
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
      selectedBankId: initialParams.bank || 'privatbank',
      fromAmount: initialParams.amount?.toString() || '',
      email: '',
      cardNumber: '',
      captchaAnswer: '',
      agreeToTerms: false,
    };
  }, [initialParams]);
}

// ✅ Хук для расчета обмена
function useExchangeCalculations(fromAmount: string, fromCurrency: string) {
  return useMemo(() => {
    const amount = Number(fromAmount);
    return amount > 0 ? calculateUahAmount(amount, fromCurrency as CryptoCurrency) : 0;
  }, [fromAmount, fromCurrency]);
}

export function ExchangeContainer({ locale: _locale, initialParams }: ExchangeContainerProps) {
  const tPage = useTranslations('ExchangePage');
  const t = useTranslations('AdvancedExchangeForm');

  const initialFormData = useExchangeFormData(initialParams);

  const form = useFormWithNextIntl<Record<string, unknown>>({
    initialValues: initialFormData,
    validationSchema: securityEnhancedUnifiedExchangeFormSchema,
    t,
    onSubmit: async (_values: Record<string, unknown>) => {
      // Form submission logic будет в task 2.4
      throw new Error('Form submission not yet implemented');
    },
  });

  const calculatedAmount = useExchangeCalculations(
    form.values.fromAmount as string,
    form.values.fromCurrency as string
  );

  return (
    <ExchangeForm.Container variant="full" className="exchange-container">
      {/* Page Header */}
      <header className="exchange-header mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground lg:text-4xl">{tPage('title')}</h1>
        <p className="mt-2 text-muted-foreground lg:text-lg">{tPage('description')}</p>
      </header>

      {/* Main Exchange Layout */}
      <ExchangeLayout form={form} t={t} calculatedAmount={calculatedAmount} />
    </ExchangeForm.Container>
  );
}
