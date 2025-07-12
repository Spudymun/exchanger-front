'use client';

import React from 'react';

interface ExchangeBenefitsProps {
  t: (key: string) => string;
}

export function ExchangeBenefits({ t }: ExchangeBenefitsProps) {
  return (
    <div className="mb-8 text-center">
      <div className="text-sm text-muted-foreground mb-4">{t('benefits.fast')}</div>
      <div className="flex justify-center gap-6 text-xs">
        <div className="font-semibold text-primary">{t('benefits.items.exchange5min')}</div>
        <div className="font-semibold text-primary">{t('benefits.items.noRegistration')}</div>
        <div className="font-semibold text-primary">{t('benefits.items.bestRate')}</div>
      </div>
    </div>
  );
}
