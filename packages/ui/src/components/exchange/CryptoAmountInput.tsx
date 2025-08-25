'use client';

import type { UseFormReturn } from '@repo/hooks';

import { useNumericInput } from '@repo/utils';

import { ExchangeForm, FormField, FormControl, FormMessage, Input } from '../..';

interface CryptoAmountInputProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Поле в форме для хранения суммы
   * @default 'fromAmount'
   */
  fieldName?: string;
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
  fieldName = 'fromAmount',
  useValidation = true,
  placeholder,
  type = 'text',
}: CryptoAmountInputProps) {
  // Валидация ввода для героической формы
  const { handleKeyDown } = useNumericInput(form.values.fromCurrency as string);

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (useValidation) {
      handleKeyDown(e, form.values[fieldName as keyof typeof form.values] as string);
    }
  };

  const fieldValue = (form.values[fieldName as keyof typeof form.values] as string) || '';
  const fieldError = form.errors[fieldName as keyof typeof form.errors];

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name={fieldName} error={fieldError}>
        <ExchangeForm.FieldLabel>{t('sending.amount')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Input
            {...form.getFieldProps(fieldName)}
            type={type}
            placeholder={placeholder || t('sending.amount')}
            value={fieldValue}
            onChange={e => form.setValue(fieldName as keyof typeof form.values, e.target.value)}
            onKeyDown={useValidation ? handleAmountKeyDown : undefined}
            aria-invalid={!!fieldError}
          />
        </FormControl>
        <FormMessage />
      </FormField>
    </ExchangeForm.FieldWrapper>
  );
}
