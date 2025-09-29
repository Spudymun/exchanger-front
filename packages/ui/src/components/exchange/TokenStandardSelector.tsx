'use client';

import { isMultiNetworkToken, getTokenStandards } from '@repo/constants';

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

interface TokenStandardSelectorProps {
  form: UseFormReturn<Record<string, unknown>>;
  t: (key: string) => string;
  /**
   * ✅ ДОБАВЛЕНО: Возможность передать стандарды токенов извне (из API)
   * Если не передано - используется fallback константы
   */
  tokenStandards?: string[];
}

/**
 * ✅ UNIFIED: Общий селектор token standard для форм обмена
 * Заменяет дублированные компоненты из SendingCard и ExchangeLayout
 */
export function TokenStandardSelector({ form, t, tokenStandards }: TokenStandardSelectorProps) {
  const currency = form.values.fromCurrency as string;
  const isMultiNetwork = isMultiNetworkToken(currency);

  if (!isMultiNetwork) {
    return <div className="h-[76px]"></div>;
  }

  const standards = tokenStandards || getTokenStandards(currency);

  return (
    <ExchangeForm.FieldWrapper>
      <FormField name="tokenStandard" error={form.errors.tokenStandard}>
        <ExchangeForm.FieldLabel>{t('sending.tokenStandard')}</ExchangeForm.FieldLabel>
        <FormControl>
          <Select
            value={form.values.tokenStandard as string}
            onValueChange={v => form.setValue('tokenStandard', v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('sending.selectStandard')} />
            </SelectTrigger>
            <SelectContent>
              {standards.map(standard => (
                <SelectItem key={standard} value={standard}>
                  {standard}
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
