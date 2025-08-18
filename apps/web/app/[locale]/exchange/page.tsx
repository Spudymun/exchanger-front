'use client';

import { useTranslations } from 'next-intl';

import { ExchangeForm } from '../../../src/components/forms/ExchangeForm';

export default function ExchangePage() {
  const t = useTranslations('ExchangePage');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">{t('title')}</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{t('description')}</p>
          </div>

          <ExchangeForm />
        </div>
      </div>
    </div>
  );
}
