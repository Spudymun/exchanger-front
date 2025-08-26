'use client';

import type { UseFormReturn } from '@repo/hooks';

import { ExchangeForm, FormField, FormControl, FormMessage, Input } from '../..';

interface AmountDisplayProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Рассчитанная сумма для отображения
   */
  calculatedAmount: number;
  /**
   * Поле в форме для хранения суммы
   * @default 'toAmount'
   */
  fieldName?: string;
}

/**
 * ✅ UNIFIED: Общий компонент для отображения рассчитанной суммы
 * Заменяет дублированные AmountDisplay из ExchangeLayout
 *
 * @param calculatedAmount - рассчитанная сумма в UAH
 * @param fieldName - имя поля в форме (по умолчанию 'toAmount')
 */
export function AmountDisplay({
  form,
  t,
  calculatedAmount,
  fieldName = 'toAmount',
}: AmountDisplayProps) {
  const fieldError = form.errors[fieldName as keyof typeof form.errors];

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name={fieldName} error={fieldError}>
        <ExchangeForm.FieldLabel>{t('receiving.amount')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Input
            value={calculatedAmount.toFixed(2)}
            readOnly
            className="bg-muted/50 text-foreground cursor-default pointer-events-none transition-none focus-visible:ring-0 focus-visible:border-input border-input"
          />
        </FormControl>
        <FormMessage />
      </FormField>
    </ExchangeForm.FieldWrapper>
  );
}
