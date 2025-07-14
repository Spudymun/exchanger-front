'use client';

import { useTranslations } from 'next-intl';

import { HeroExchangeForm, type HeroExchangeFormData } from './HeroExchangeForm';

// ========================================================================================
// HeroSection v2.0 - Полная перестройка с адаптивным контролем ширины
// Интеграция AdaptiveContainer для математического управления размерами
// Замена фиксированных ограничений (max-w-5xl) на flexible width control
// ========================================================================================

export function HeroSection() {
  const t = useTranslations('HomePage');

  const handleHeroExchange = (data: HeroExchangeFormData) => {
    // Handle hero exchange logic - navigate to exchange page with data
    if (data) {
      // eslint-disable-next-line no-console
      console.info('Hero exchange request:', data);
      // Navigate to exchange page with form data (to be implemented)
    }
  };

  return (
    <section className="text-center space-y-8 sm:space-y-12 mb-16 sm:mb-20 lg:mb-24">
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
