'use client';

import { useTranslations } from 'next-intl';

import { useRouter } from '../i18n/navigation';

import { HeroExchangeForm, type HeroExchangeFormData } from './HeroExchangeForm';

// ========================================================================================
// HeroSection v2.0 - Полная перестройка с адаптивным контролем ширины
// Интеграция AdaptiveContainer для математического управления размерами
// Замена фиксированных ограничений (max-w-5xl) на flexible width control
// ========================================================================================

export function HeroSection() {
  const t = useTranslations('HomePage');
  const router = useRouter();

  const handleHeroExchange = (data: HeroExchangeFormData) => {
    // Handle hero exchange logic - navigate to exchange page with data
    if (data) {
      // Create URL with search parameters for exchange page
      const searchParams = new URLSearchParams();

      // Add required parameters based on ExchangeContainer initialParams interface
      if (data.fromCurrency) {
        // Add token standard to from currency if exists
        const fromValue = data.tokenStandard
          ? `${data.fromCurrency}-${data.tokenStandard}`
          : data.fromCurrency;
        searchParams.set('from', fromValue);
      }

      if (data.toCurrency) {
        searchParams.set('to', data.toCurrency);
      }

      if (data.selectedBankId) {
        searchParams.set('bank', data.selectedBankId);
      }

      if (data.fromAmount && data.fromAmount.trim() !== '') {
        searchParams.set('amount', data.fromAmount);
      }

      // Navigate to exchange page with parameters
      const url = `/exchange?${searchParams.toString()}`;
      router.push(url);
    }
  };

  return (
    <section
      id="exchange-section"
      className="text-center space-y-8 sm:space-y-12 mb-16 sm:mb-20 lg:mb-24"
    >
      {/* Hero Header */}
      <div className="space-y-6 sm:space-y-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
          {t('title')}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto leading-relaxed">
          {t('description')}
        </p>
      </div>

      {/* Hero Exchange Form - Mobile-first approach */}
      <HeroExchangeForm
        onExchange={handleHeroExchange}
        useAdaptiveContainer={false}
        className="max-w-full overflow-hidden"
      />
    </section>
  );
}
