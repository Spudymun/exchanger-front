import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

// Constants for Storybook demos - no magic numbers per Rule 11
const DEMO_LOADING_DELAY = 2000;

// Form field component to reduce main component complexity
function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  step,
  children,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {type === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {children}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={required}
        />
      )}
    </div>
  );
}

// Create a demo component that mimics ExchangeForm without tRPC dependencies
// This follows Rule 17 (centralized solutions) for Storybook demonstrations
function ExchangeFormDemo({ onSubmit }: { onSubmit?: (data: unknown) => void | Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currency: 'BTC',
    amount: '',
    walletAddress: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit?.(formData);
    } catch (error) {
      console.error('Ошибка при отправке формы:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Обмен криптовалют</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          id="currency"
          label="Валюта"
          type="select"
          value={formData.currency}
          onChange={value => setFormData(prev => ({ ...prev, currency: value }))}
        >
          <option value="BTC">Bitcoin (BTC)</option>
          <option value="ETH">Ethereum (ETH)</option>
          <option value="USDT">Tether (USDT)</option>
        </FormField>

        <FormField
          id="amount"
          label="Сумма"
          type="number"
          step="0.00000001"
          placeholder="0.00000000"
          value={formData.amount}
          onChange={value => setFormData(prev => ({ ...prev, amount: value }))}
          required
        />

        <FormField
          id="wallet"
          label="Адрес кошелька"
          placeholder="Введите адрес кошелька"
          value={formData.walletAddress}
          onChange={value => setFormData(prev => ({ ...prev, walletAddress: value }))}
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Обработка...' : 'Создать обмен'}
        </button>
      </form>
    </div>
  );
}

// Mock QueryClient for Storybook - optimized for demo per Rule 11
const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // No retries in Storybook
      staleTime: Infinity, // Cache never stales
    },
    mutations: {
      retry: false,
    },
  },
});

const meta: Meta<typeof ExchangeFormDemo> = {
  title: 'Forms/ExchangeForm',
  component: ExchangeFormDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Демонстрация формы для обмена криптовалют с интегрированным расчетом и валидацией. Использует централизованные паттерны проекта.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <QueryClientProvider client={mockQueryClient}>
        <div className="w-full p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: (data: unknown) => {
      console.log('Storybook ExchangeForm submitted:', data);
      alert('Форма отправлена! Проверьте консоль для деталей.');
    },
  },
};

export const WithLoadingState: Story = {
  args: {
    onSubmit: async (data: unknown) => {
      console.log('Storybook ExchangeForm with loading:', data);
      // Simulating loading state for demonstration
      await new Promise(resolve => setTimeout(resolve, DEMO_LOADING_DELAY));
      alert('Заказ создан успешно!');
    },
  },
};
