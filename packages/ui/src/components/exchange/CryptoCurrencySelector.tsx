'use client';

import { CRYPTOCURRENCIES, getDefaultTokenStandard } from '@repo/constants';

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

interface CryptoCurrencySelectorProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Автоматически устанавливать tokenStandard при выборе валюты
   * @default false
   */
  autoSetTokenStandard?: boolean;
  /**
   * Placeholder для селекта
   */
  placeholder?: string;
  /**
   * Дополнительный callback при смене валюты
   * Для интеграции с business логикой (например, auto-fill минимальной суммы)
   */
  onCurrencyChange?: (currency: string) => void;
}

/**
 * ✅ UNIFIED: Общий селектор криптовалют для форм обмена
 * Заменяет дублированные CurrencySelector из SendingCard и ExchangeLayout
 *
 * @param autoSetTokenStandard - если true, автоматически устанавливает tokenStandard при выборе валюты
 */
export function CryptoCurrencySelector({
  form,
  t,
  autoSetTokenStandard = false,
  placeholder,
  onCurrencyChange,
}: CryptoCurrencySelectorProps) {
  const handleCurrencyChange = (currency: string) => {
    form.setValue('fromCurrency', currency);

    if (autoSetTokenStandard) {
      const defaultStandard = getDefaultTokenStandard(currency);
      if (defaultStandard) {
        form.setValue('tokenStandard', defaultStandard);
      } else {
        form.setValue('tokenStandard', '');
      }
    }

    // Вызываем дополнительную business логику если предоставлена
    onCurrencyChange?.(currency);
  };

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name="fromCurrency" error={form.errors.fromCurrency}>
        <ExchangeForm.FieldLabel>{t('sending.cryptocurrency')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Select value={form.values.fromCurrency as string} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder || t('sending.selectCurrency')} />
            </SelectTrigger>
            <SelectContent>
              {CRYPTOCURRENCIES.map(currency => (
                <SelectItem key={currency} value={currency}>
                  {currency}
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
