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

// ✅ MIGRATION: Типы для банков из API
interface BankData {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  isActive: boolean;
  isDefault: boolean; // ✅ MIGRATION: Добавляем поле is_default
  priority: number;
  reserve: number;
}

interface ExchangeBankSelectorProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * ✅ MIGRATION: Банки из API вместо getBanksForCurrency
   */
  banks?: BankData[];
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
 * ✅ MIGRATION: Общий селектор банков для форм обмена
 * Теперь получает данные из API вместо static констант
 *
 * @param banks - банки из API
 * @param fieldName - имя поля в форме (по умолчанию 'selectedBankId')
 */
export function ExchangeBankSelector({
  form,
  t,
  banks = [],
  fieldName = 'selectedBankId',
  placeholder,
}: ExchangeBankSelectorProps) {
  const selectedBankId = form.values[fieldName as keyof typeof form.values] as string;
  const bankError = form.errors[fieldName as keyof typeof form.errors];

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name={fieldName} error={bankError}>
        <ExchangeForm.FieldLabel>{t('receiving.bank')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Select
            value={selectedBankId}
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
