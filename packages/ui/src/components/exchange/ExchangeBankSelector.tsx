'use client';

import { getBanksForCurrency, type FiatCurrency, FIAT_CURRENCIES } from '@repo/constants';

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

interface ExchangeBankSelectorProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * Массив банков для отображения (если не передан, будет вычислен автоматически из toCurrency)
   */
  banks?: ReturnType<typeof getBanksForCurrency>;
  /**
   * Поле в форме для хранения выбранного банка
   * @default 'selectedBankId'
   */
  fieldName?: string;
  /**
   * Placeholder для селекта
   */
  placeholder?: string;
}

/**
 * ✅ UNIFIED: Общий селектор банков для форм обмена
 * Заменяет дублированные BankSelector из ReceivingCard и ExchangeLayout
 *
 * @param banks - если передан, использует эти банки, иначе вычисляет из toCurrency
 * @param fieldName - имя поля в форме (по умолчанию 'selectedBankId')
 */
export function ExchangeBankSelector({
  form,
  t,
  banks: providedBanks,
  fieldName = 'selectedBankId',
  placeholder,
}: ExchangeBankSelectorProps) {
  // Если банки не переданы, вычисляем из toCurrency (как в ExchangeLayout)
  const banks =
    providedBanks ||
    (() => {
      const currency = form.values.toCurrency;
      return FIAT_CURRENCIES.includes(currency as (typeof FIAT_CURRENCIES)[number])
        ? getBanksForCurrency(currency as FiatCurrency)
        : [];
    })();

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name={fieldName} error={form.errors[fieldName as keyof typeof form.errors]}>
        <ExchangeForm.FieldLabel>{t('receiving.bank')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Select
            value={form.values[fieldName as keyof typeof form.values] as string}
            onValueChange={v => form.setValue(fieldName as keyof typeof form.values, v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder || t('receiving.selectBank')} />
            </SelectTrigger>
            <SelectContent>
              {banks.map(bank => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name}
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
