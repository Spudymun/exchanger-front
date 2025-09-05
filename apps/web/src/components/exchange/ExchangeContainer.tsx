'use client';

import {
  EXCHANGE_DEFAULTS,
  getDefaultTokenStandard,
  UI_DEBOUNCE_CONSTANTS,
  BANKS_BY_CURRENCY,
  type CryptoCurrency,
  CRYPTOCURRENCIES,
  TOKEN_STANDARDS,
} from '@repo/constants';
import { calculateUahAmount, getCurrencyLimits } from '@repo/exchange-core';
import { useFormWithNextIntl } from '@repo/hooks';
import { useAutoMinAmount } from '@repo/hooks/src/client-hooks';
import { ExchangeForm, ExchangeErrorBoundary } from '@repo/ui';
import {
  securityEnhancedFullExchangeFormSchema,
  type SecurityEnhancedFullExchangeForm,
} from '@repo/utils';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';

import { useExchangeMutation } from '../../hooks/useExchangeMutation';
import { useRouter } from '../../i18n/navigation';

import { ExchangeLayout } from './ExchangeLayout';

// ⚡ Используем централизованную debounce константу из архитектуры
// Заменяет хардкод DEBOUNCE_DELAY_MS = 50

// ⚡ Helper: получить дефолтный банк из централизованной константы (вместо хардкода 'privatbank')
const getDefaultBank = () => BANKS_BY_CURRENCY.UAH[1]?.id || 'monobank';

// ⚡ Helper: создать дефолтные данные формы (выделено для снижения complexity)
const createDefaultFormData = () => ({
  fromCurrency: EXCHANGE_DEFAULTS.FROM_CURRENCY,
  tokenStandard: getDefaultTokenStandard(EXCHANGE_DEFAULTS.FROM_CURRENCY) || 'TRC-20',
  toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
  selectedBankId: getDefaultBank(),
  fromAmount: '',
  // Дополнительные поля для полной формы
  email: '',
  cardNumber: '',
  captcha: '',
  agreeToTerms: false,
});

// ⚡ Helper: валидация и парсинг currency из URL
const parseValidatedCurrency = (fromParam: string | undefined): string => {
  if (!fromParam) return EXCHANGE_DEFAULTS.FROM_CURRENCY;

  const [currency] = fromParam.split('-', 2);
  return currency && CRYPTOCURRENCIES.includes(currency as CryptoCurrency)
    ? currency
    : EXCHANGE_DEFAULTS.FROM_CURRENCY;
};

// ⚡ Helper: валидация и парсинг token standard из URL
const parseValidatedTokenStandard = (fromParam: string | undefined): string | undefined => {
  if (!fromParam) return undefined;

  const parts = fromParam.split('-');
  if (parts.length < 2) return undefined;

  const currency = parts[0] as CryptoCurrency;
  const tokenStandard = parts.slice(1).join('-');

  // ✅ SECURITY: Проверяем token standard против whitelist
  if (currency in TOKEN_STANDARDS) {
    const validStandards = TOKEN_STANDARDS[currency as keyof typeof TOKEN_STANDARDS];
    return validStandards.includes(tokenStandard as never) ? tokenStandard : undefined;
  }

  return undefined;
};

// ⚡ Helper: валидация bank ID
const parseValidatedBank = (bankParam: string | undefined): string => {
  const isValidBankId = (id: string): id is (typeof BANKS_BY_CURRENCY.UAH)[number]['id'] => {
    return BANKS_BY_CURRENCY.UAH.some(bank => bank.id === id);
  };

  return bankParam && isValidBankId(bankParam) ? bankParam : getDefaultBank();
};

// ⚡ Helper: валидация amount с правильными per-currency лимитами
const parseValidatedAmount = (
  amount: number | undefined,
  currency: CryptoCurrency
): number | undefined => {
  if (!amount || !Number.isFinite(amount) || amount <= 0) return undefined;

  // ✅ Используем правильные per-currency лимиты через getCurrencyLimits
  const limits = getCurrencyLimits(currency);

  // Проверяем против РЕАЛЬНЫХ минимумов и максимумов для данной валюты
  if (amount < limits.minCrypto || amount > limits.maxCrypto) {
    return undefined; // Fallback к дефолтным значениям
  }

  return amount;
};

// ⚡ Helper: создать валидированные параметры из URL с ПРАВИЛЬНОЙ validation
const createValidatedFormData = (
  initialParams: NonNullable<ExchangeContainerProps['initialParams']>
) => {
  const validatedCurrency = parseValidatedCurrency(initialParams.from);
  const validatedTokenStandard = parseValidatedTokenStandard(initialParams.from);
  const validatedBank = parseValidatedBank(initialParams.bank);
  // ✅ Передаем currency для per-currency validation
  const validatedAmount = parseValidatedAmount(
    initialParams.amount,
    validatedCurrency as CryptoCurrency
  );

  return {
    fromCurrency: validatedCurrency as CryptoCurrency,
    tokenStandard:
      validatedTokenStandard ||
      getDefaultTokenStandard(validatedCurrency as CryptoCurrency) ||
      'TRC-20',
    toCurrency: initialParams.to === 'UAH' ? 'UAH' : EXCHANGE_DEFAULTS.TO_CURRENCY,
    selectedBankId: validatedBank,
    fromAmount: validatedAmount?.toString() || '',
    // Дополнительные поля для полной формы
    email: '',
    cardNumber: '',
    captcha: '',
    agreeToTerms: false,
  };
};

interface ExchangeContainerProps {
  locale: string;
  initialParams?: {
    from?: string;
    to?: string;
    bank?: string;
    amount?: number;
  };
}

// ✅ Хук для инициализации формы с production-ready URL validation
function useExchangeFormData(initialParams?: ExchangeContainerProps['initialParams']) {
  return useMemo(() => {
    // ⚡ Refactored: использование helper функций для снижения complexity
    return initialParams ? createValidatedFormData(initialParams) : createDefaultFormData();
  }, [initialParams]);
}

// ✅ Хук для расчета обмена
function useExchangeCalculations(fromAmount: string, fromCurrency: string) {
  return useMemo(() => {
    const amount = Number(fromAmount);
    return amount > 0 ? calculateUahAmount(amount, fromCurrency as CryptoCurrency) : 0;
  }, [fromAmount, fromCurrency]);
}

// ⚡ Refactored: выделен хук для auto-fill логики (снижение размера основной функции)
function useAutoFillLogic(
  form: ReturnType<typeof useFormWithNextIntl<SecurityEnhancedFullExchangeForm>>
) {
  const { shouldAutoFill, getMinAmount } = useAutoMinAmount(
    form.values.fromCurrency as CryptoCurrency,
    form.values.fromAmount as string
  );

  useEffect(() => {
    if (shouldAutoFill) {
      const timeoutId = setTimeout(() => {
        const minAmount = getMinAmount();
        form.setValue('fromAmount', minAmount.toString());
      }, UI_DEBOUNCE_CONSTANTS.EXCHANGE_CALCULATION_DELAY);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldAutoFill, getMinAmount, form.setValue]);
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
        bankId: values.selectedBankId || getDefaultBank(), // ⚡ Centralized fallback
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

  // ⚡ Refactored: использование выделенного хука
  useAutoFillLogic(form);

  const isValid =
    form.isValid &&
    Number(form.values.fromAmount) >= limits.minCrypto &&
    calculatedAmount >= 100 && // минимум UAH
    Boolean(form.values.selectedBankId);

  return (
    /* ✅ PRODUCTION-READY: Error Boundaries для graceful fallbacks (10/10) */
    <ExchangeErrorBoundary
      onError={(error, errorInfo) => {
        // ✅ Structured logging для troubleshooting
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('[ExchangeContainer] Error caught:', { error, errorInfo, initialParams });
        }
      }}
    >
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
    </ExchangeErrorBoundary>
  );
}
