'use client';

import { useTranslations } from 'next-intl';

import { HeroExchangeForm, type HeroExchangeFormData } from './HeroExchangeForm';

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
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">{t('title')}</h1>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">{t('description')}</p>

      <div className="max-w-4xl mx-auto">
        <HeroExchangeForm onExchange={handleHeroExchange} />
      </div>
    </div>
  );
}
