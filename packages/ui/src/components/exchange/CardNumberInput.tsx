'use client';

import type { UseFormReturn } from '@repo/hooks';
import { formatCardNumberDisplay } from '@repo/utils';

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
 * Автоматически форматирует номер карты с пробелами после каждых 4 цифр
 * при сохранении чистого значения (только цифры) в форме
 *
 * @param fieldName - имя поля в форме (по умолчанию 'cardNumber')
 */
export function CardNumberInput({
  form,
  t,
  fieldName = 'cardNumber',
  placeholder = '**** **** **** ****',
}: CardNumberInputProps) {
  const rawValue = (form.values[fieldName as keyof typeof form.values] as string) || '';
  const fieldError = form.errors[fieldName as keyof typeof form.errors];

  // Format for display
  const displayValue = formatCardNumberDisplay(rawValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters to store clean value
    const cleanValue = e.target.value.replace(/\D/g, '');
    form.setValue(fieldName, cleanValue);
  };

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name={fieldName} error={fieldError}>
        <ExchangeForm.FieldLabel>{t('receiving.cardNumber')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Input
            placeholder={placeholder}
            inputMode="numeric"
            className="transition-colors"
            value={displayValue}
            onChange={handleChange}
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
