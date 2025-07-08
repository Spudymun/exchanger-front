'use client';

import { CURRENCY_NAMES } from '@repo/constants';
import type { ExchangeRate } from '@repo/exchange-core';
import { cardStyles, textStyles, loadingStyles, gridStyles, combineStyles } from '@repo/ui';
import { Loader2, TrendingUp } from 'lucide-react';

import { useExchangeRates } from '../hooks/useExchangeMutation';

// Интерфейс для ответа API с курсами
interface RatesResponse {
  rates: ExchangeRate[];
  timestamp: Date;
}

// Компонент для отображения карточки курса
function RateCard({ rate }: { rate: ExchangeRate }) {
  return (
    <div key={rate.currency} className={cardStyles.base}>
      <div className="flex items-center justify-between">
        <div>
          <p className={textStyles.heading.sm}>{rate.currency}</p>
          <p className={textStyles.body.sm}>
            {CURRENCY_NAMES[rate.currency as keyof typeof CURRENCY_NAMES]}
          </p>
        </div>
        <div className="text-right">
          <p className={textStyles.heading.md}>{rate.uahRate.toLocaleString('ru-RU')} ₴</p>
          <p className={textStyles.body.sm}>за 1 {rate.currency}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className={textStyles.body.sm}>Комиссия:</span>
        <span
          className={combineStyles(textStyles.body.sm, 'font-medium', textStyles.accent.secondary)}
        >
          {rate.commission}%
        </span>
      </div>
    </div>
  );
}

// Компонент для отображения информации о последнем обновлении
function LastUpdateInfo({ timestamp }: { timestamp?: Date }) {
  return (
    <div className="rounded-lg bg-blue-50 p-3">
      <p className={combineStyles(textStyles.body.sm, textStyles.accent.primary)}>
        Курсы обновляются каждые 5 минут. Последнее обновление:{' '}
        {timestamp ? new Date(timestamp).toLocaleString('ru-RU') : 'Неизвестно'}
      </p>
    </div>
  );
}

export function ExchangeRates() {
  const { data: ratesData, isLoading, error } = useExchangeRates();

  // Type assertion для правильной типизации данных
  const typedRatesData = ratesData as RatesResponse | undefined;

  if (isLoading) {
    return (
      <div className={loadingStyles.container}>
        <Loader2 className={combineStyles(loadingStyles.spinner, textStyles.accent.primary)} />
        <span className={loadingStyles.text}>Загрузка курсов...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className={combineStyles(textStyles.body.md, textStyles.accent.error)}>
          Ошибка загрузки курсов: {error.message}
        </p>
      </div>
    );
  }

  if (!typedRatesData?.rates) {
    return (
      <div className="rounded-lg bg-gray-50 p-4">
        <p className={combineStyles(textStyles.body.md, 'text-gray-600')}>Курсы не доступны</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <TrendingUp className={combineStyles('h-5 w-5', textStyles.accent.success)} />
        <h3 className={textStyles.heading.md}>Актуальные курсы обмена</h3>
      </div>

      <div className={gridStyles.responsive}>
        {typedRatesData.rates.map((rate: ExchangeRate) => (
          <RateCard key={rate.currency} rate={rate} />
        ))}
      </div>

      <LastUpdateInfo timestamp={typedRatesData.timestamp} />
    </div>
  );
}
