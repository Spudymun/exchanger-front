'use client';

import React from 'react';

interface ExchangeBenefitsProps {
  t: (key: string) => string;
}

export function ExchangeBenefits({ t }: ExchangeBenefitsProps) {
  // Fix hydration mismatch: ensure consistent rendering between server and client
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR, show minimal content to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="text-center">
        <div className="text-sm text-muted-foreground mb-4" suppressHydrationWarning>
          Loading benefits...
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs">
          <div className="font-semibold text-primary" suppressHydrationWarning>
            ...
          </div>
          <div className="font-semibold text-primary" suppressHydrationWarning>
            ...
          </div>
          <div className="font-semibold text-primary" suppressHydrationWarning>
            ...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-sm text-muted-foreground mb-4">{t('benefits.fast')}</div>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs">
        <div className="font-semibold text-primary">{t('benefits.items.exchange5min')}</div>
        <div className="font-semibold text-primary">{t('benefits.items.noRegistration')}</div>
        <div className="font-semibold text-primary">{t('benefits.items.bestRate')}</div>
      </div>
    </div>
  );
}
