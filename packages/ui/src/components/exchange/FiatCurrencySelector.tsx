'use client';

import { FIAT_CURRENCIES } from '@repo/constants';
import type { UseFormReturn } from '@repo/hooks';

import {
  ExchangeForm,
  FormField,
  FormControl,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../..';

interface FiatCurrencySelectorProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Поле в форме для хранения валюты
   * @default 'toCurrency'
   */
  fieldName?: string;
  /**
   * Сбрасывать ли selectedBankId при смене валюты
   * @default true
   */
  resetBankOnChange?: boolean;
}

/**
 * ✅ UNIFIED: Общий селектор фиатных валют для форм обмена
 * Заменяет дублированные FiatCurrencySelector из ReceivingCard
 *
 * @param fieldName - имя поля в форме (по умолчанию 'toCurrency')
 * @param resetBankOnChange - сбрасывать ли выбранный банк при смене валюты
 */
export function FiatCurrencySelector({
  form,
  t,
  fieldName = 'toCurrency',
  resetBankOnChange = true,
}: FiatCurrencySelectorProps) {
  const fieldValue = form.values[fieldName as keyof typeof form.values] as string;
  const fieldError = form.errors[fieldName as keyof typeof form.errors];

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name={fieldName} error={fieldError}>
        <ExchangeForm.FieldLabel>{t('receiving.fiatCurrency')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Select
            value={fieldValue}
            onValueChange={v => {
              form.setValue(fieldName as keyof typeof form.values, v);
              if (resetBankOnChange) {
                form.setValue('selectedBankId', '');
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIAT_CURRENCIES.map(c => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormField>
    </ExchangeForm.FieldWrapper>
  );
}
