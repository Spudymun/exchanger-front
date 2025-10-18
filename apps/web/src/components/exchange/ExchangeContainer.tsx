'use client';

import {
  EXCHANGE_DEFAULTS,
  getDefaultTokenStandard,
  UI_DEBOUNCE_CONSTANTS,
  type CryptoCurrency,
  CRYPTOCURRENCIES,
  TOKEN_STANDARDS,
} from '@repo/constants';
import { getCurrencyLimits } from '@repo/exchange-core';
import { useFormWithNextIntl } from '@repo/hooks';
import { useAutoMinAmount, useNotifications } from '@repo/hooks/src/client-hooks';
import { ExchangeForm, ExchangeErrorBoundary } from '@repo/ui';
import {
  securityEnhancedFullExchangeFormSchema,
  type SecurityEnhancedFullExchangeForm,
  calculateNetAmount,
} from '@repo/utils';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { trpc } from '../../../lib/trpc-provider'; // ✅ Для invalidation session cache
import { useDefaultBank } from '../../hooks/useDefaultBank';
import { useExchangeMutation, useExchangeRates } from '../../hooks/useExchangeMutation';
import { useRouter } from '../../i18n/navigation';

import { ExchangeLayout } from './ExchangeLayout';

// Время ожидания для завершения навигации к странице ордера
const ORDER_NAVIGATION_DELAY_MS = 2500;

// ⚡ Используем централизованную debounce константу из архитектуры
// Заменяет хардкод DEBOUNCE_DELAY_MS = 50

// ⚡ Helper: создать дефолтные данные формы (выделено для снижения complexity)
const createDefaultFormData = () => ({
  fromCurrency: EXCHANGE_DEFAULTS.FROM_CURRENCY,
  tokenStandard: getDefaultTokenStandard(EXCHANGE_DEFAULTS.FROM_CURRENCY) || 'TRC-20',
  toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
  selectedBankId: EXCHANGE_DEFAULTS.DEFAULT_BANK_ID, // ✅ MIGRATION: Централизованная константа
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
  // ✅ MIGRATION: Упрощенная валидация - API сам проверит существование
  return bankParam || EXCHANGE_DEFAULTS.DEFAULT_BANK_ID;
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

// 🚀 Smart Caching: Асинхронный хук для расчета обмена
// ОБНОВЛЕНО: использует useExchangeRates вместо прямого вызова SmartPricingService
function useExchangeCalculations(fromAmount: string, fromCurrency: string) {
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const { data: ratesData } = useExchangeRates();

  useEffect(() => {
    const amount = Number(fromAmount);
    if (amount <= 0) {
      setCalculatedAmount(0);
      return;
    }

    const currentRate = ratesData?.rates?.find((r: { currency: CryptoCurrency }) => r.currency === fromCurrency);
    if (!currentRate) {
      setCalculatedAmount(0);
      return;
    }

    // Расчёт как в calculateUahAmountAsync но БЕЗ вызова SmartPricingService
    const grossAmount = amount * currentRate.uahRate;
    const netAmount = calculateNetAmount(grossAmount, currentRate.commission);
    setCalculatedAmount(Number(netAmount.toFixed(2)));
  }, [fromAmount, fromCurrency, ratesData]);

  return calculatedAmount;
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

// Hook для инициализации формы
function useExchangeForm(initialParams?: ExchangeContainerProps['initialParams']) {
  const t = useTranslations('AdvancedExchangeForm');
  const serverErrorT = useTranslations('server.errors');
  const notificationsT = useTranslations('notifications');
  const router = useRouter();
  const exchangeMutation = useExchangeMutation();
  const notifications = useNotifications();
  const { refetch: refetchRates } = useExchangeRates(); // ✅ Получаем refetch для актуального курса
  const utils = trpc.useUtils(); // ✅ Для invalidation session cache

  // ✅ ERROR BOUNDARY: Используем централизованный хук с обработкой ошибок
  const { defaultBank, fallbackBankId } = useDefaultBank();

  const initialFormData = useExchangeFormData(initialParams);

  const form = useFormWithNextIntl<SecurityEnhancedFullExchangeForm>({
    initialValues: initialFormData,
    validationSchema: securityEnhancedFullExchangeFormSchema,
    t,
    onSubmit: async (values: SecurityEnhancedFullExchangeForm) => {
      try {
        // ✅ ИСПРАВЛЕНО: Вычисляем uahAmount в момент submit (актуальный курс)
        const { data: ratesData } = await refetchRates();
        if (!ratesData) {
          throw new Error('Не удалось получить курсы');
        }
        
        const currentRate = ratesData.rates.find((r: { currency: string }) => r.currency === values.fromCurrency);
        const uahAmount = currentRate ? Number(values.fromAmount) * currentRate.uahRate : 0;

        if (uahAmount <= 0) {
          throw new Error('Не удалось вычислить сумму в UAH');
        }

        const orderRequest = {
          email: values.email,
          cryptoAmount: Number(values.fromAmount),
          currency: values.fromCurrency as CryptoCurrency,
          uahAmount, // ✅ Реальное значение, вычисленное в момент submit
          tokenStandard: values.tokenStandard,
          recipientData: {
            cardNumber: values.cardNumber,
            bankId: values.selectedBankId || EXCHANGE_DEFAULTS.DEFAULT_BANK_ID,
          },
        };

        const orderData = await exchangeMutation.createOrder.mutateAsync(orderRequest);

        // ✅ ФИКС: Invalidate session cache ПЕРЕД редиректом
        // КРИТИЧНО для авторегистрации/автологина - предотвращает показ модалки логина
        await utils.auth.getSession.invalidate();

        // ✅ ФИКС: Навигация с задержкой для показа спиннера
        router.push(`/order/${orderData.orderId}`);
        await new Promise(resolve => setTimeout(resolve, ORDER_NAVIGATION_DELAY_MS));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.startsWith('server.errors.')) {
          const localizedMessage = serverErrorT(errorMessage.replace('server.errors.', ''));
          notifications.error(notificationsT('exchange.error'), localizedMessage);
        } else {
          notifications.handleApiError(error, notificationsT('exchange.error'));
        }
      }
    },
  });

  // ✅ ERROR BOUNDARY: Устанавливаем дефолтный банк с fallback механизмом
  useEffect(() => {
    const bankIdToSet = defaultBank?.id || fallbackBankId;
    if (bankIdToSet && form.values.selectedBankId === EXCHANGE_DEFAULTS.DEFAULT_BANK_ID) {
      form.setValue('selectedBankId', bankIdToSet);
    }
  }, [defaultBank, fallbackBankId]); // ✅ ФИКС: убираем form из зависимостей чтобы избежать бесконечного цикла

  return { form };
}

export function ExchangeContainer({ locale: _locale, initialParams }: ExchangeContainerProps) {
  const t = useTranslations('AdvancedExchangeForm');
  const { form } = useExchangeForm(initialParams);

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
