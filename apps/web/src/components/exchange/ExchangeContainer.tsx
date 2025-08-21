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

// Helper function to reduce complexity
function parseInitialFormData(
  initialParams?: ExchangeContainerProps['initialParams']
): Record<string, unknown> {
  if (!initialParams) {
    return {
      fromCurrency: EXCHANGE_DEFAULTS.FROM_CURRENCY,
      tokenStandard: getDefaultTokenStandard(EXCHANGE_DEFAULTS.FROM_CURRENCY) || 'TRC-20',
      toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
      selectedBankId: 'privatbank',
      cryptoAmount: 0,
      uahAmount: 0,
      email: '',
      cardNumber: '',
      captchaAnswer: '',
      agreeToTerms: false,
      rememberData: false,
    };
  }

  const fromCurrency = initialParams.from?.split('-')[0] || EXCHANGE_DEFAULTS.FROM_CURRENCY;
  const tokenStandard =
    initialParams.from?.split('-')[1] ||
    getDefaultTokenStandard(EXCHANGE_DEFAULTS.FROM_CURRENCY) ||
    'TRC-20';
  const selectedBankId = initialParams.bank || 'privatbank';

  return {
    fromCurrency,
    tokenStandard,
    toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
    selectedBankId,
    cryptoAmount: initialParams.amount || 0,
    uahAmount: 0,
    email: '',
    cardNumber: '',
    captchaAnswer: '',
    agreeToTerms: false,
    rememberData: false,
  };
}

export function ExchangeContainer({ initialParams }: ExchangeContainerProps) {
  const t = useTranslations('AdvancedExchangeForm');

  // Parse initial values from query params with memoization
  const initialFormData = useMemo(() => parseInitialFormData(initialParams), [initialParams]);

  const form = useFormWithNextIntl({
    initialValues: initialFormData,
    validationSchema: securityEnhancedAdvancedExchangeFormSchema,
    t,
    onSubmit: async (_values: Record<string, unknown>) => {
      // Form submission logic будет в task 2.4
      throw new Error('Form submission not yet implemented');
    },
  });

  return (
    <ExchangeForm.Container variant="full" className="exchange-container">
      {/* Page Header */}
      <header className="exchange-header mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground lg:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground lg:text-lg">{t('subtitle')}</p>
      </header>

      {/* Main Exchange Layout */}
      <ExchangeLayout form={form} t={t} />
    </ExchangeForm.Container>
  );
}
