'use client';

import { CURRENCY_NAMES } from '@repo/constants';
import { Loader2, TrendingUp } from 'lucide-react';

import { trpc } from '../../lib/trpc';

// Интерфейс для данных курса валют
interface RateData {
  currency: string;
  uahRate: number;
  commission: number;
}

// Компонент для отображения карточки курса
function RateCard({ rate }: { rate: RateData }) {
  return (
    <div
      key={rate.currency}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{rate.currency}</p>
          <p className="text-xs text-gray-500">
            {CURRENCY_NAMES[rate.currency as keyof typeof CURRENCY_NAMES]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            {rate.uahRate.toLocaleString('ru-RU')} ₴
          </p>
          <p className="text-xs text-gray-500">за 1 {rate.currency}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">Комиссия:</span>
        <span className="text-xs font-medium text-orange-600">{rate.commission}%</span>
      </div>
    </div>
  );
}

// Компонент для отображения информации о последнем обновлении
function LastUpdateInfo({ timestamp }: { timestamp?: Date }) {
  return (
    <div className="rounded-lg bg-blue-50 p-3">
      <p className="text-xs text-blue-600">
        Курсы обновляются каждые 5 минут. Последнее обновление:{' '}
        {timestamp ? new Date(timestamp).toLocaleString('ru-RU') : 'Неизвестно'}
      </p>
    </div>
  );
}

export function ExchangeRates() {
  const { data: ratesData, isLoading, error } = trpc.exchange.getRates.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-600">Загрузка курсов...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm text-red-600">Ошибка загрузки курсов: {error.message}</p>
      </div>
    );
  }

  if (!ratesData?.rates) {
    return (
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">Курсы не доступны</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Актуальные курсы обмена</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ratesData.rates.map(rate => (
          <RateCard key={rate.currency} rate={rate} />
        ))}
      </div>

      <LastUpdateInfo timestamp={ratesData.timestamp} />
    </div>
  );
}
