'use client';

import { EXCHANGE_DEFAULTS, getDefaultTokenStandard, type CryptoCurrency } from '@repo/constants';
import { calculateUahAmount, getCurrencyLimits } from '@repo/exchange-core';
import { useFormWithNextIntl } from '@repo/hooks';
import { useAutoMinAmount } from '@repo/hooks/src/client-hooks';
import { ExchangeForm } from '@repo/ui';
import {
  securityEnhancedFullExchangeFormSchema,
  type SecurityEnhancedFullExchangeForm,
} from '@repo/utils';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';

import { useExchangeMutation } from '../../hooks/useExchangeMutation';
import { useRouter } from '../../i18n/navigation';

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
        // Дополнительные поля для полной формы
        email: '',
        cardNumber: '',
        captcha: '',
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
      // Дополнительные поля для полной формы
      email: '',
      cardNumber: '',
      captcha: '',
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

// Create order submission function
function createOrderSubmission(
  exchangeMutation: ReturnType<typeof useExchangeMutation>,
  router: ReturnType<typeof useRouter>
) {
  return async (values: SecurityEnhancedFullExchangeForm) => {
    // Calculate amount at submit time to get the most up-to-date value
    const submitTimeAmount = calculateUahAmount(
      Number(values.fromAmount),
      values.fromCurrency as CryptoCurrency
    );

    const orderRequest = {
      email: values.email,
      cryptoAmount: Number(values.fromAmount),
      currency: values.fromCurrency as CryptoCurrency,
      uahAmount: submitTimeAmount,
      recipientData: {
        cardNumber: values.cardNumber,
        bankId: values.selectedBankId || 'privatbank',
      },
    };

    const orderData = await exchangeMutation.createOrder.mutateAsync(orderRequest);
    router.push(`/order/${orderData.orderId}`);
  };
}

export function ExchangeContainer({ locale: _locale, initialParams }: ExchangeContainerProps) {
  const t = useTranslations('AdvancedExchangeForm');
  const router = useRouter();
  const exchangeMutation = useExchangeMutation();

  const initialFormData = useExchangeFormData(initialParams);

  const form = useFormWithNextIntl<SecurityEnhancedFullExchangeForm>({
    initialValues: initialFormData,
    validationSchema: securityEnhancedFullExchangeFormSchema,
    t,
    onSubmit: createOrderSubmission(exchangeMutation, router),
  });

  const calculatedAmount = useExchangeCalculations(
    form.values.fromAmount as string,
    form.values.fromCurrency as string
  );

  // Динамические лимиты для валидации (аналогично hero форме)
  const limits = useMemo(() => {
    return getCurrencyLimits(form.values.fromCurrency as CryptoCurrency);
  }, [form.values.fromCurrency]);

  // Auto-fill логика для прямых переходов на страницу (когда amount не передан в URL)
  const { shouldAutoFill, getMinAmount } = useAutoMinAmount(
    form.values.fromCurrency as CryptoCurrency,
    form.values.fromAmount as string
  );

  useEffect(() => {
    if (shouldAutoFill) {
      const minAmount = getMinAmount();
      form.setValue('fromAmount', minAmount.toString());
    }
  }, [shouldAutoFill, getMinAmount, form.setValue]);

  const isValid =
    form.isValid &&
    Number(form.values.fromAmount) >= limits.minCrypto &&
    calculatedAmount >= 100 && // минимум UAH
    Boolean(form.values.selectedBankId);

  return (
    <ExchangeForm.Container variant="full" className="exchange-container">
      {/* Main Exchange Layout */}
      <ExchangeForm
        exchangeData={form.values}
        isSubmitting={form.isSubmitting}
        isValid={isValid}
        defaultErrorStyling="disabled"
        onSubmit={form.handleSubmit}
      >
        <ExchangeLayout form={form} t={t} calculatedAmount={calculatedAmount} isValid={isValid} />
      </ExchangeForm>
    </ExchangeForm.Container>
  );
}
