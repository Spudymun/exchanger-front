'use client';

'use client';

import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';

import { HeroExchangeForm } from './HeroExchangeForm';

export function HeroSection() {
  const t = useTranslations('HomePage');

  const handleExchange = (amount: number) => {
    // Handle exchange logic - could dispatch to state management or API
    if (amount > 0) {
      // eslint-disable-next-line no-console
      console.info('Exchange request:', amount, 'USDT');
    }
  };

  return (
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">{t('title')}</h1>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">{t('description')}</p>

      <div className="max-w-md mx-auto mb-8">
        <HeroExchangeForm onExchange={handleExchange} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" size="lg" className="text-lg px-8 py-3">
          {t('learnMore')}
        </Button>
      </div>
    </div>
  );
}
