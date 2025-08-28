'use client';

import type { UseFormReturn } from '@repo/hooks';

import { ExchangeForm, FormField, FormControl, FormMessage, Input } from '../..';

interface CardNumberInputProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Поле в форме для хранения номера карты
   * @default 'cardNumber'
   */
  fieldName?: string;
  /**
   * Placeholder для инпута
   */
  placeholder?: string;
}

/**
 * ✅ UNIFIED: Общий инпут для ввода номера карты
 * Заменяет дублированные CardNumberInput из ExchangeLayout
 *
 * @param fieldName - имя поля в форме (по умолчанию 'cardNumber')
 */
export function CardNumberInput({
  form,
  t,
  fieldName = 'cardNumber',
  placeholder = '**** **** **** ****',
}: CardNumberInputProps) {
  const fieldValue = (form.values[fieldName as keyof typeof form.values] as string) || '';
  const fieldError = form.errors[fieldName as keyof typeof form.errors];

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name={fieldName} error={fieldError}>
        <ExchangeForm.FieldLabel>{t('receiving.cardNumber')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Input
            {...form.getFieldProps(fieldName)}
            placeholder={placeholder}
            inputMode="numeric"
            className="transition-colors"
            value={fieldValue}
            autoComplete="cc-number"
            name="cardNumber"
            id="card-number"
            required
          />
        </FormControl>
        <FormMessage />
      </FormField>
    </ExchangeForm.FieldWrapper>
  );
}
