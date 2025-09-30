'use client';

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

// ✅ MIGRATION: Типы для fiat валют из API
interface FiatCurrencyData {
  symbol: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

interface FiatCurrencySelectorProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * ✅ MIGRATION: Валюты из API вместо static FIAT_CURRENCIES
   */
  currencies?: FiatCurrencyData[];
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
 * ✅ MIGRATION: Общий селектор фиатных валют для форм обмена
 * Теперь получает данные из API вместо static констант
 *
 * @param currencies - валюты из API
 * @param fieldName - имя поля в форме (по умолчанию 'toCurrency')
 * @param resetBankOnChange - сбрасывать ли выбранный банк при смене валюты
 */
export function FiatCurrencySelector({
  form,
  t,
  currencies = [],
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
              {currencies.map(currency => (
                <SelectItem key={currency.symbol} value={currency.symbol}>
                  {currency.symbol}
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
