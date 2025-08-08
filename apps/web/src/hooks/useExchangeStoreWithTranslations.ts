/**
 * Локализованный wrapper для useExchangeStore
 * Следует паттерну useAuthMutations.ts - добавляет переводы к базовому функционалу
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ:
 * - Использует существующую систему createNextIntlZodErrorMap
 * - Не дублирует логику валидации, а локализует сообщения
 * - Интегрируется с централизованными Zod схемами
 */

import { useExchangeStore } from '@repo/hooks/src/client-hooks';
import {
  createNextIntlZodErrorMap,
  emailSchema,
  cryptoAmountStringSchema,
  currencySchema,
} from '@repo/utils';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { useNotificationsWithTranslations } from './useNotificationsWithTranslations';

// Создаем локализованную схему для exchange формы
const createLocalizedExchangeFormSchema = (
  _validationT: (key: string, values?: Record<string, string | number>) => string
) =>
  z.object({
    fromCurrency: currencySchema,
    fromAmount: cryptoAmountStringSchema,
    userEmail: emailSchema,
    cardNumber: z.string().min(1),
    agreementAccepted: z.boolean().refine(val => val === true),
  });

// Helper функции для валидации
const processValidationErrors = (
  errors: z.ZodError['errors'],
  notifications: ReturnType<typeof useNotificationsWithTranslations>
) => {
  const errorMap = new Map<string, string[]>();

  for (const error of errors) {
    const fieldKey = String(error.path[0]);
    const list = errorMap.get(fieldKey) ?? [];
    list.push(error.message);
    errorMap.set(fieldKey, list);
  }

  const errorCount = errorMap.size;
  if (errorCount > 1) notifications.showMultipleValidationErrors(errorCount);
  else notifications.showValidationError();
};

const getFieldSchema = (fieldName: string): z.ZodSchema<unknown> => {
  switch (fieldName) {
    case 'fromCurrency':
      return currencySchema;
    case 'fromAmount':
      return cryptoAmountStringSchema;
    case 'userEmail':
      return emailSchema;
    case 'cardNumber':
      return z.string().min(1);
    default:
      // Возвращаем строгую схему, которая всегда проходит, чтобы не выбрасывать исключения
      return z.unknown();
  }
};

// Безопасное получение ключа шага без индексирования по числу
const getStepKey = (
  steps: Array<{ id: string }>,
  step: number
): 'form' | 'review' | 'payment' | 'completed' => {
  const formIndex = steps.findIndex(s => s.id === 'form');
  if (step === formIndex) return 'form';

  const reviewIndex = steps.findIndex(s => s.id === 'review');
  if (step === reviewIndex) return 'review';

  const paymentIndex = steps.findIndex(s => s.id === 'payment');
  if (step === paymentIndex) return 'payment';

  const completedIndex = steps.findIndex(s => s.id === 'completed');
  if (step === completedIndex) return 'completed';

  return 'form';
};

// Имплементация проверок вынесена из хука для сокращения его длины
const validateFormImpl = (
  baseStore: ReturnType<typeof useExchangeStore>,
  validationT: (key: string, values?: Record<string, string | number>) => string,
  notifications: ReturnType<typeof useNotificationsWithTranslations>,
  exchangeFormSchema: z.ZodTypeAny
) => {
  const { formData, calculation } = baseStore;

  const validationData = {
    fromCurrency: formData.fromCurrency,
    fromAmount: formData.fromAmount,
    userEmail: formData.userEmail,
    cardNumber: formData.recipientData.cardNumber,
    agreementAccepted: formData.agreementAccepted,
  };

  const errorMap = createNextIntlZodErrorMap({ t: validationT, locale: 'current' });
  const result = exchangeFormSchema.safeParse(validationData, { errorMap });

  if (!result.success) {
    processValidationErrors(result.error.errors, notifications);
    return false;
  }

  if (!calculation || !calculation.isValid) {
    notifications.showCalculationError();
    return false;
  }

  return true;
};

const validateFieldImpl = (
  fieldName: string,
  value: unknown,
  validationT: (key: string, values?: Record<string, string | number>) => string
) => {
  if (fieldName === 'unknown') return { isValid: true, error: null as string | null };

  const schema = getFieldSchema(fieldName);
  const errorMap = createNextIntlZodErrorMap({ t: validationT, locale: 'current' });
  const result = schema.safeParse(value, { errorMap });

  if (result.success) return { isValid: true, error: null as string | null };

  const firstError = result.error.errors[0];
  return { isValid: false, error: firstError ? firstError.message : validationT('invalid') };
};

export function useExchangeStoreWithTranslations() {
  const baseStore = useExchangeStore();
  const notifications = useNotificationsWithTranslations();
  const validationT = useTranslations('AdvancedExchangeForm.validation');
  const exchangeT = useTranslations('exchange');

  const exchangeFormSchema = createLocalizedExchangeFormSchema(validationT);

  return {
    ...baseStore,
    validateForm: () => validateFormImpl(baseStore, validationT, notifications, exchangeFormSchema),
    validateField: (fieldName: string, value: unknown) =>
      validateFieldImpl(fieldName, value, validationT),
    getLocalizedStepInfo: (step: number) => ({
      title: exchangeT(`steps.${getStepKey(baseStore.steps, step)}.title`),
      description: exchangeT(`steps.${getStepKey(baseStore.steps, step)}.description`),
    }),
    getLocalizedOrderStatus: (status: string) => exchangeT(`orderStatus.${status.toLowerCase()}`),
    notifications,
    showOrderCreated: (orderId: string) => notifications.showOrderCreated(orderId),
    showOrderCompleted: (orderId: string) => notifications.showOrderCompleted(orderId),
    showExchangeSuccess: () => notifications.showExchangeSuccess(),
    showExchangeError: (message?: string) => notifications.showExchangeError(message),
  };
}

export type UseExchangeStoreWithTranslationsReturn = ReturnType<
  typeof useExchangeStoreWithTranslations
>;
