'use client';

import { CRYPTOCURRENCIES } from '@repo/constants';
import { useForm, useNotifications } from '@repo/hooks/src/client-hooks';
import {
  FormField,
  FormControl,
  FormLabel,
  FormMessage,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import React from 'react';
import { z } from 'zod';

import { useExchangeMutation } from '../../hooks/useExchangeMutation';

// Схема валидации для формы (без uahAmount, так как вычисляется автоматически)
const exchangeFormSchema = z.object({
  currency: z.enum(['BTC', 'ETH', 'USDT', 'LTC'] as const),
  cryptoAmount: z
    .string()
    .min(1, 'Введите сумму')
    .refine(val => Number(val) > 0, 'Сумма должна быть больше 0'),
  email: z.string().email('Введите корректный email'),
});

interface ExchangeFormData extends Record<string, unknown> {
  currency: string;
  cryptoAmount: string;
  email: string;
}

export const ExchangeForm: React.FC = () => {
  const notifications = useNotifications();
  const exchangeMutation = useExchangeMutation({
    onSuccess: order => {
      // Используем правильные свойства из типов ответа
      const orderId = 'orderId' in order ? order.orderId : order.id;
      notifications.orderCreated(orderId);
    },
    onError: error => {
      notifications.handleExchangeError(error);
    },
  });

  const form = useForm<ExchangeFormData>({
    initialValues: {
      currency: 'BTC',
      cryptoAmount: '',
      email: '',
    },
    validationSchema: exchangeFormSchema,
    onSubmit: async values => {
      // Для создания заказа нужен uahAmount, который нужно вычислить
      // В реальном приложении это может быть отдельный API call или вычисление
      const cryptoAmount = Number(values.cryptoAmount);
      const mockExchangeRate = 1000000; // Временная заглушка для расчета курса
      const uahAmount = cryptoAmount * mockExchangeRate;

      await exchangeMutation.createOrder.mutateAsync({
        currency: values.currency as 'BTC' | 'ETH' | 'USDT' | 'LTC',
        cryptoAmount,
        email: values.email,
        uahAmount,
      });
    },
  });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      <ExchangeCurrencyField form={form} />
      <ExchangeAmountField form={form} />
      <ExchangeEmailField form={form} />
      <ExchangeSubmitButton form={form} isLoading={exchangeMutation.isCreatingOrder} />
    </form>
  );
};

interface FormComponentProps {
  form: ReturnType<typeof useForm<ExchangeFormData>>;
}

const ExchangeCurrencyField: React.FC<FormComponentProps> = ({ form }) => (
  <FormField name="currency" error={form.errors.currency}>
    <FormLabel>Валюта</FormLabel>
    <FormControl>
      <Select
        value={form.values.currency as string}
        onValueChange={value => form.setValue('currency', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Выберите валюту" />
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
);

const ExchangeAmountField: React.FC<FormComponentProps> = ({ form }) => (
  <FormField name="cryptoAmount" error={form.errors.cryptoAmount}>
    <FormLabel>Сумма</FormLabel>
    <FormControl>
      <Input
        {...form.getFieldProps('cryptoAmount')}
        type="number"
        placeholder="Введите сумму"
        step="0.00000001"
        min="0"
      />
    </FormControl>
    <FormMessage />
  </FormField>
);

const ExchangeEmailField: React.FC<FormComponentProps> = ({ form }) => (
  <FormField name="email" error={form.errors.email}>
    <FormLabel>Email</FormLabel>
    <FormControl>
      <Input {...form.getFieldProps('email')} type="email" placeholder="Введите email" />
    </FormControl>
    <FormMessage />
  </FormField>
);

interface SubmitButtonProps extends FormComponentProps {
  isLoading: boolean;
}

const ExchangeSubmitButton: React.FC<SubmitButtonProps> = ({ form, isLoading }) => (
  <Button type="submit" disabled={isLoading || !form.isValid} className="w-full">
    {isLoading ? 'Создание заявки...' : 'Создать заявку'}
  </Button>
);
