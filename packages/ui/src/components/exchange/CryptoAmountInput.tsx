'use client';

import type { UseFormReturn } from '@repo/hooks';

import { useNumericInput } from '@repo/utils';

import { ExchangeForm, FormField, FormControl, FormMessage, Input } from '../..';

interface CryptoAmountInputProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Использовать ли валидацию ввода useNumericInput
   * @default true
   */
  useValidation?: boolean;
  /**
   * Placeholder для инпута
   */
  placeholder?: string;
  /**
   * Тип инпута
   * @default 'text'
   */
  type?: string;
}

/**
 * ✅ UNIFIED: Общий инпут для ввода криптовалютной суммы
 * Заменяет дублированные AmountInput из SendingCard и ExchangeLayout
 *
 * @param fieldName - имя поля в форме (по умолчанию 'fromAmount')
 * @param useValidation - использовать ли useNumericInput для валидации
 */
export function CryptoAmountInput({
  form,
  t,
  useValidation = true,
  placeholder,
  type = 'text',
}: CryptoAmountInputProps) {
  // ✅ SIMPLIFIED: Direct use of known field names (eliminated unused flexibility)
  const currencyFieldName = 'fromCurrency';

  // Валидация ввода с правильным полем валюты
  const { handleKeyDown } = useNumericInput(
    form.values[currencyFieldName as keyof typeof form.values] as string
  );

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (useValidation) {
      handleKeyDown(e, form.values.fromAmount as string); // ✅ SIMPLIFIED: direct field name usage
    }
  };

  const fieldValue = (form.values.fromAmount as string) || ''; // ✅ SIMPLIFIED: direct field name usage
  const fieldError = form.errors.fromAmount; // ✅ SIMPLIFIED: direct field name usage

  // Получаем field props БЕЗ перезаписи onChange/onBlur
  const fieldProps = form.getFieldProps('fromAmount'); // ✅ SIMPLIFIED: direct field name usage

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name="fromAmount" error={fieldError}>
        {' '}
        {/* ✅ SIMPLIFIED: direct field name usage */}
        <ExchangeForm.FieldLabel>{t('sending.amount')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Input
            type={type}
            placeholder={placeholder || t('sending.amount')}
            value={fieldValue}
            onChange={e => {
              // Вызываем ОРИГИНАЛЬНЫЙ onChange из getFieldProps (содержит валидацию)
              fieldProps.onChange(e);
            }}
            onBlur={() => {
              // Вызываем ОРИГИНАЛЬНЫЙ onBlur из getFieldProps (запускает business validation)
              if (fieldProps.onBlur) {
                fieldProps.onBlur();
              }
            }}
            onKeyDown={useValidation ? handleAmountKeyDown : undefined}
            aria-invalid={!!fieldError}
          />
        </FormControl>
        <FormMessage />
      </FormField>
    </ExchangeForm.FieldWrapper>
  );
}
