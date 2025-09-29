'use client';

import { type CryptoCurrency } from '@repo/constants';
import { getMinCryptoAmountForUI } from '@repo/exchange-core';
import { type UseFormReturn } from '@repo/hooks';
import { useFormWithNextIntl } from '@repo/hooks/src/client-hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TokenStandardSelector,
  CryptoCurrencySelector,
  CryptoAmountInput,
  SendingInfo,
} from '@repo/ui';
import React from 'react';

import { useSupportedCurrencies, useSupportedTokenStandards } from '../../hooks/useExchangeMutation';

import type { HeroExchangeFormData } from '../HeroExchangeForm';

interface SendingCardProps {
  form: ReturnType<typeof useFormWithNextIntl<HeroExchangeFormData>>;
  t: (key: string) => string;
  minAmount: number;
}

export function SendingCard({ form, t, minAmount }: SendingCardProps) {
  // ✅ ИСПОЛЬЗУЕМ API для получения валют
  const { data: supportedCurrencies } = useSupportedCurrencies();
  // ✅ ИСПОЛЬЗУЕМ API для получения стандартов токенов
  const { data: supportedTokenStandards } = useSupportedTokenStandards();

  // Функция для автоматического обновления суммы при смене валюты
  const handleCurrencyChange = (newCurrency: string) => {
    // Получаем минимальную сумму для новой валюты напрямую
    const minAmountForCurrency = getMinCryptoAmountForUI(newCurrency as CryptoCurrency);

    // Обновляем сумму до минимальной для новой валюты
    form.setValue('fromAmount', minAmountForCurrency.toString());
  };

  return (
    <Card className="bg-card text-card-foreground border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-foreground">{t('sending.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CryptoCurrencySelector
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            t={t}
            autoSetTokenStandard={true}
            onCurrencyChange={handleCurrencyChange}
            currencies={supportedCurrencies}
          />
          <TokenStandardSelector
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            t={t}
            tokenStandards={supportedTokenStandards}
          />
        </div>
        <CryptoAmountInput
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
          useValidation={true}
        />
        <SendingInfo
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          t={t}
          minAmount={minAmount}
        />
      </CardContent>
    </Card>
  );
}
